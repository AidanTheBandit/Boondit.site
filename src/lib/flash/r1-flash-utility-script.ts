/**
 * R1 Flash Utility - Main Script
 * Handles all flash operations, UI updates, and event listeners
 */

import { FastbootDevice, USER_ACTION_MAP, setDebugLevel } from 'android-fastboot';
import type { FastbootDevice as FastbootDeviceType } from 'android-fastboot';
import { downloadFirmware, fetchLatestFirmware } from '@/lib/flash/firmware-downloader';
import { FastbootManager, enterFastbootViaBROM } from '@/lib/flash/fastboot-manager';

// Initialize fastboot devices
const bootloaderDevice = new FastbootDevice();
const fastbootdDevice = new FastbootDevice();

// Device managers
const bootloaderManager = new FastbootManager(bootloaderDevice);
const fastbootdManager = new FastbootManager(fastbootdDevice);

// State
const state = {
  bootloaderConnected: false,
  fastbootdConnected: false,
  busy: false,
};

// UI Elements
const elements = {
  autoFlash: document.getElementById("autoFlash") as HTMLButtonElement,
  enterFastboot: document.getElementById("enterFastboot") as HTMLButtonElement,
  connectBootloader: document.getElementById("connectBootloader") as HTMLButtonElement,
  rebootFastbootd: document.getElementById("rebootFastbootd") as HTMLButtonElement,
  connectFastbootd: document.getElementById("connectFastbootd") as HTMLButtonElement,
  flashStock: document.getElementById("flashStock") as HTMLButtonElement,
  mtkUnlock: document.getElementById("mtkUnlock") as HTMLButtonElement,
  webusbStatus: document.getElementById("webusbStatus") as HTMLSpanElement,
  webserialStatus: document.getElementById("webserialStatus") as HTMLSpanElement,
  bootloaderStatus: document.getElementById("bootloaderStatus") as HTMLSpanElement,
  fastbootdStatus: document.getElementById("fastbootdStatus") as HTMLSpanElement,
  statusLog: document.getElementById("statusLog") as HTMLDivElement,
  downloadBar: document.getElementById("downloadBar") as HTMLDivElement,
  downloadPct: document.getElementById("downloadPct") as HTMLSpanElement,
  flashBar: document.getElementById("flashBar") as HTMLDivElement,
  flashPct: document.getElementById("flashPct") as HTMLSpanElement,
  flashAction: document.getElementById("flashAction") as HTMLSpanElement,
  flashItem: document.getElementById("flashItem") as HTMLParagraphElement,
};

// Initialize
setDebugLevel(1);

// Check API support
const supportsWebUsb = "usb" in navigator;
const supportsWebSerial = "serial" in navigator;

elements.webusbStatus.textContent = supportsWebUsb ? "Supported" : "Unavailable";
elements.webusbStatus.classList.toggle("is-ok", supportsWebUsb);
elements.webusbStatus.classList.toggle("is-error", !supportsWebUsb);

elements.webserialStatus.textContent = supportsWebSerial ? "Supported" : "Unavailable";
elements.webserialStatus.classList.toggle("is-ok", supportsWebSerial);
elements.webserialStatus.classList.toggle("is-error", !supportsWebSerial);

// Utility Functions
function logStatus(message: string, type: "info" | "success" | "error" = "info"): void {
  if (!elements.statusLog) return;
  const entry = document.createElement("div");
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  elements.statusLog.appendChild(entry);
  elements.statusLog.scrollTop = elements.statusLog.scrollHeight;
}

function setProgress(bar: HTMLElement, label: HTMLElement, value: number): void {
  if (!bar || !label) return;
  const pct = Math.round(value * 100);
  bar.style.width = `${pct}%`;
  label.textContent = `${pct}%`;
}

function setConnectionStatus(): void {
  elements.bootloaderStatus.textContent = state.bootloaderConnected
    ? "Connected"
    : "Not connected";
  elements.bootloaderStatus.classList.toggle("is-ok", state.bootloaderConnected);
  elements.bootloaderStatus.classList.toggle("is-error", !state.bootloaderConnected);

  elements.fastbootdStatus.textContent = state.fastbootdConnected
    ? "Connected"
    : "Not connected";
  elements.fastbootdStatus.classList.toggle("is-ok", state.fastbootdConnected);
  elements.fastbootdStatus.classList.toggle("is-error", !state.fastbootdConnected);
}

function setButtonStates(): void {
  const { bootloaderConnected, fastbootdConnected, busy } = state;

  elements.autoFlash.disabled = busy;
  elements.enterFastboot.disabled = busy;
  elements.connectBootloader.disabled = busy;
  elements.rebootFastbootd.disabled = busy || !bootloaderConnected;
  elements.connectFastbootd.disabled = busy;
  elements.flashStock.disabled = busy || !fastbootdConnected;
  elements.mtkUnlock.disabled = true; // Experimental - disabled by default
}

// Flash Operations
async function enterFastbootFromBrom(): Promise<void> {
  state.busy = true;
  setButtonStates();
  logStatus("Requesting BROM device...");
  
  try {
    await enterFastbootViaBROM();
    logStatus("BROM fastboot command sent.", "success");
  } catch (error: any) {
    logStatus(`BROM fastboot failed: ${error.message || error}`, "error");
  } finally{
    state.busy = false;
    setButtonStates();
  }
}

async function connectBootloader(): Promise<void> {
  state.busy = true;
  setButtonStates();
  logStatus("Requesting bootloader device...");
  
  try {
    await bootloaderManager.connect();
    state.bootloaderConnected = true;
    logStatus("Bootloader device connected.", "success");
  } catch (error: any) {
    logStatus(`Bootloader connection failed: ${error.message || error}`, "error");
  } finally {
    state.busy = false;
    setButtonStates();
    setConnectionStatus();
  }
}

async function rebootToFastbootd(): Promise<void> {
  state.busy = true;
  setButtonStates();
  logStatus("Rebooting device into fastbootd...");
  
  try {
    await bootloaderManager.rebootToFastbootd();
    state.bootloaderConnected = false;
    logStatus("Device rebooted. Select it again in fastbootd.", "success");
  } catch (error: any) {
    logStatus(`Reboot failed: ${error.message || error}`, "error");
  } finally {
    state.busy = false;
    setButtonStates();
    setConnectionStatus();
  }
}

async function connectFastbootd(): Promise<void> {
  state.busy = true;
  setButtonStates();
  logStatus("Requesting fastbootd device...");
  
  try {
    await fastbootdManager.connect();
    state.fastbootdConnected = true;
    logStatus("Fastbootd device connected.", "success");
  } catch (error: any) {
    logStatus(`Fastbootd connection failed: ${error.message || error}`, "error");
  } finally {
    state.busy = false;
    setButtonStates();
    setConnectionStatus();
  }
}

async function flashStockOs(): Promise<void> {
  state.busy = true;
  setButtonStates();
  setProgress(elements.flashBar, elements.flashPct, 0);
  setProgress(elements.downloadBar, elements.downloadPct, 0);
  elements.flashAction.textContent = "Preparing";
  elements.flashItem.textContent = "Finding latest firmware";

  try {
    const asset = await fetchLatestFirmware();
    logStatus(`Latest firmware found: ${asset.name}`);
    elements.flashAction.textContent = "Downloading";
    elements.flashItem.textContent = asset.name;

    const firmwareFile = await downloadFirmware(asset, (progress) => {
      setProgress(elements.downloadBar, elements.downloadPct, progress.percentage);
      const sizeMB = (progress.loaded / 1024 / 1024).toFixed(1);
      const totalMB = (progress.total / 1024 / 1024).toFixed(1);
      const speedMBps = (progress.speed / 1024 / 1024).toFixed(2);
      const etaMin = Math.ceil(progress.eta / 60);
      elements.flashItem.textContent = `${sizeMB}/${totalMB} MB @ ${speedMBps} MB/s (${etaMin}m remaining)`;
    });

    logStatus(`Firmware downloaded: ${firmwareFile.size} bytes`);
    elements.flashAction.textContent = "Flashing";
    elements.flashItem.textContent = "Preparing flash...";

    await fastbootdManager.flashFactory(
      firmwareFile,
      true, // wipe always enabled
      () => logStatus("Reconnect device if prompted.", "info"),
      (action, item, progress) => {
        const actionLabel = USER_ACTION_MAP[action] || action || "Working";
        elements.flashAction.textContent = actionLabel;
        elements.flashItem.textContent = item ? `Target: ${item}` : "Working";
        setProgress(elements.flashBar, elements.flashPct, progress || 0);
      }
    );

    logStatus("Flash completed successfully.", "success");
    elements.flashAction.textContent = "Completed";
    elements.flashItem.textContent = "Device flashed";
    setProgress(elements.flashBar, elements.flashPct, 1);
  } catch (error: any) {
    logStatus(`Flash failed: ${error.message || error}`, "error");
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    elements.flashAction.textContent = "Error";
    elements.flashItem.textContent = "Flash failed";
  } finally {
    state.busy = false;
    setButtonStates();
  }
}

async function autoFlash(): Promise<void> {
  state.busy = true;
  setButtonStates();
  logStatus("Starting auto flash sequence...", "info");

  try {
    // Step 0: Enter fastboot from BROM (optional - catches errors gracefully)
    logStatus("Step 0: Entering fastboot mode from BROM...", "info");
    try {
      await enterFastbootFromBrom();
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      logStatus("BROM step skipped (device may already be in fastboot)", "info");
    }

    // Step 1: Connect bootloader
    logStatus("Step 1: Connecting to bootloader...", "info");
    await connectBootloader();
    if (!state.bootloaderConnected) {
      throw new Error("Failed to connect to bootloader");
    }

    // Step 2: Flash directly in bootloader mode (no fastbootd needed for auto mode)
    logStatus("Step 2: Flashing firmware...", "info");
    await flashStockOs();

    logStatus("Auto flash sequence completed successfully!", "success");
  } catch (error: any) {
    logStatus(`Auto flash failed: ${error.message || error}`, "error");
  } finally {
    state.busy = false;
    setButtonStates();
  }
}

// Event Listeners
elements.autoFlash.addEventListener("click", autoFlash);
elements.enterFastboot.addEventListener("click", enterFastbootFromBrom);
elements.connectBootloader.addEventListener("click", connectBootloader);
elements.rebootFastbootd.addEventListener("click", rebootToFastbootd);
elements.connectFastbootd.addEventListener("click", connectFastbootd);
elements.flashStock.addEventListener("click", flashStockOs);

// MTK Unlock (disabled for now)
elements.mtkUnlock.addEventListener("click", () => {
  logStatus("MTK bootloader unlock is experimental and not yet implemented.", "error");
});

// Initialize button states
setButtonStates();
setConnectionStatus();

logStatus("R1 Flash Utility ready.");
