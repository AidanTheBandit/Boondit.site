/**
 * MTK Bootloader Unlock (WebUSB Implementation)
 * 
 * This is a WebUSB port of select MTKClient functionality for unlocking
 * MediaTek bootloaders directly in the browser.
 * 
 * Based on: https://github.com/bkerler/mtkclient
 * 
 * SECURITY WARNING: This tool bypasses device security mechanisms.
 * Use only on devices you own.
 * 
 * REQUIREMENTS:
 * - Chrome/Edge 61+ (WebUSB support)
 * - Device in BROM mode (powered off, USB connected)
 * - HTTPS connection (or localhost)
 * - Exploit payloads available at /payloads/mtk/*.bin
 */

export interface MTKDevice {
  usbDevice: USBDevice;
  chipset: string;
  isLocked: boolean;
}

export interface UnlockProgress {
  phase: string;
  step: string;
  progress: number; // 0-1
}

export type UnlockProgressCallback = (progress: UnlockProgress) => void;

/**
 * Check if WebUSB is available in browser
 */
export function isWebUSBAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Start MTK bootloader unlock process
 * 
 * User must have device in BROM mode:
 * 1. Power off R1 completely
 * 2. Connect USB cable to computer
 * 3. Immediately power on while holding Volume Up button
 * 4. Device should be detected as "MediaTek BROM" in WebUSB picker
 */
export async function unlockBootloaderWebUSB(
  onProgress?: UnlockProgressCallback
): Promise<void> {
  if (!isWebUSBAvailable()) {
    throw new Error(
      'WebUSB API not available. Please use Chrome/Edge 61+ on Windows/Mac/Linux'
    );
  }

  // Dynamically import the orchestrator to avoid bundling on page load
  const { unlockBootloaderWebUSB: executeUnlock } = await import('@/lib/mtk/orchestrator');

  await executeUnlock(onProgress);
}

/**
 * Check bootloader lock state (requires device already in fastboot/bootloader)
 * This is informational only - doesn't require BROM mode
 */
export async function checkBootloaderStatus(device: MTKDevice): Promise<boolean> {
  console.log('[MTK] Checking bootloader status not yet implemented');
  throw new Error('Status check requires DA communication - not implemented yet');
}

/**
 * Available BROM exploits and supported devices
 */
export const BROM_EXPLOITS = {
  kamakiri: {
    devices: ['MT6765', 'MT6768', 'MT6771', 'MT6785', 'MT6873', 'MT6875', 'MT6885', 'MT6889', 'MT6833'],
    description: 'Standard exploit for mid-range devices',
  },
  kamakiri2: {
    devices: ['MT6765'],
    description: 'Enhanced exploit for MT6765 with better stability',
  },
  hashimoto: {
    devices: ['MT6761', 'MT6762', 'MT6763', 'MT6765', 'MT6768'],
    description: 'Alternative exploit for certain chipsets',
  },
  amonet: {
    devices: ['MT6580', 'MT6582', 'MT6595', 'MT6735'],
    description: 'Legacy exploit for older devices',
  },
} as const;

/**
 * Payload requirements info
 */
export const PAYLOAD_INFO = {
  location: '/payloads/mtk/',
  required: ['kamakiri.bin', 'kamakiri2.bin', 'hashimoto.bin', 'amonet.bin'],
  notes: 'Payloads must be extracted from official MTKClient release',
  source: 'https://github.com/bkerler/mtkclient/tree/main/Payloads',
} as const;

