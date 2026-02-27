/**
 * Fastboot Manager
 * Simplified wrapper around FastbootDevice for easier state management
 */

import type { FastbootDevice as FastbootDeviceType } from 'android-fastboot';

export class FastbootManager {
  private device: FastbootDeviceType;
  private connected: boolean = false;

  constructor(device: FastbootDeviceType) {
    this.device = device;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error("Device already connected");
    }
    
    await this.device.connect();
    this.connected = true;
  }

  async rebootToFastbootd(): Promise<void> {
    if (!this.connected) {
      throw new Error("Device not connected");
    }
    
    await this.device.runCommand("reboot-fastboot");
    this.connected = false;
  }

  async flashFactory(
    firmwareFile: File,
    wipe: boolean,
    onReconnect: () => void,
    onProgress: (action: string, item: string, progress: number) => void
  ): Promise<void> {
    if (!this.connected) {
      throw new Error("Device not connected");
    }
    
    await this.device.flashFactoryZip(
      firmwareFile,
      wipe,
      onReconnect,
      onProgress
    );
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.connected = false;
  }
}

/**
 * Enter fastboot mode using BROM Web Serial
 */
export async function enterFastbootViaBROM(): Promise<void> {
  const port = await navigator.serial.requestPort({
    filters: [{ usbVendorId: 0x0e8d, usbProductId: 0x2000 }],
  });

  await port.open({ baudRate: 115200 });
  const writer = port.writable.getWriter();
  
  const encoder = new TextEncoder();
  const command = encoder.encode("FASTBOOT");
  
  await writer.write(command);
  await writer.close();
  await port.close();
}
