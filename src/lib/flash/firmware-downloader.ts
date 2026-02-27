/**
 * Firmware Downloader
 * Handles firmware download with progress tracking
 */

export interface FirmwareAsset {
  name: string;
  apiUrl: string;
  url: string;
  mirrorUrl: string | null;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
}

export type ProgressCallback = (progress: DownloadProgress) => void;

const FIRMWARE_MIRROR_BASE = 
  (window.location.hostname.includes("github.dev") ||
   window.location.hostname.includes("githubpreview.dev") ||
   window.location.hostname.includes("localhost"))
    ? "/firmware"
    : "https://boondit.site/firmware";

/**
 * Fetch latest firmware metadata from GitHub API
 */
export async function fetchLatestFirmware(): Promise<FirmwareAsset> {
  const response = await fetch(
    "https://api.github.com/repos/rabbit-hmi-oss/firmware/releases/latest"
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  const asset = (data.assets || []).find((entry: any) =>
    entry.name && entry.name.toLowerCase().endsWith(".zip")
  );
  
  if (!asset) {
    throw new Error("No firmware zip asset found in the latest release.");
  }
  
  return {
    name: asset.name,
    apiUrl: asset.url,
    url: asset.browser_download_url,
    mirrorUrl: FIRMWARE_MIRROR_BASE ? `${FIRMWARE_MIRROR_BASE}/${asset.name}` : null,
  };
}

/**
 * Download firmware zip with progress tracking
 */
export async function downloadFirmware(
  asset: FirmwareAsset,
  onProgress?: ProgressCallback
): Promise<File> {
  const candidateUrls = [
    { label: "Boondit Mirror", url: asset.mirrorUrl },
    { label: "GitHub API", url: asset.apiUrl, headers: { Accept: "application/octet-stream" } },
    { label: "GitHub Direct", url: asset.url },
  ].filter(c => c.url);

  let response: Response | undefined;
  let usedUrl = "";

  for (const candidate of candidateUrls) {
    try {
      response = await fetch(candidate.url!, {
        headers: candidate.headers || {},
        redirect: "follow",
        cache: "no-store",
      });
      if (response.ok) {
        usedUrl = candidate.label;
        break;
      }
    } catch (error) {
      console.error(`${candidate.label} failed:`, error);
      response = undefined;
    }
  }

  if (!response || !response.ok) {
    throw new Error("Firmware download failed from all sources.");
  }

  console.log(`Downloading from: ${usedUrl}`);

  const contentLength = Number(response.headers.get("content-length") || 0);
  
  if (!response.body || !response.body.getReader) {
    const blob = await response.blob();
    return new File([blob], asset.name, { type: "application/zip" });
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      chunks.push(value);
      received += value.length;
      
      if (onProgress && contentLength) {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        const speed = received / elapsed;
        const remaining = contentLength - received;
        const eta = remaining / speed;
        
        onProgress({
          loaded: received,
          total: contentLength,
          percentage: received / contentLength,
          speed,
          eta,
        });
      }
    }
  }

  const blob = new Blob(chunks, { type: "application/zip" });
  return new File([blob], asset.name, { type: "application/zip" });
}
