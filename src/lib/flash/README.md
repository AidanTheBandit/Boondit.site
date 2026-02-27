# Flash Utility Library

This directory contains the core flash logic for the R1 Flash Utility.

## Files

- `fastboot-manager.ts` - FastbootDevice wrapper with connection management
- `firmware-downloader.ts` - Firmware download with progress tracking
- `auto-flash.ts` - Automated flash workflow
- `mtk-unlock.ts` - MTKClient bootloader unlock (Web Serial implementation)

## Usage

```typescript
import { FastbootManager } from '@/lib/flash/fastboot-manager';
import { downloadFirmware } from '@/lib/flash/firmware-downloader';
import { runAutoFlash } from '@/lib/flash/auto-flash';
```
