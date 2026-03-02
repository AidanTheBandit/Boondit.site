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
 * Uses server proxy to bypass CORS restrictions from GitHub
 */
export async function downloadFirmware(
  asset: FirmwareAsset,
  onProgress?: ProgressCallback
): Promise<File> {
  // Extract version from asset name (e.g., "rabbit_OS_v1.0.0.zip" → "v1.0.0")
  const versionMatch = asset.name.match(/_(v[\d.]+)\.zip$/);
  const version = versionMatch ? versionMatch[1] : null;

  // Build candidate URLs with priority order
  const candidateUrls: Array<{ label: string; url: string }> = [];

  // Priority 1: Local Boondit mirror if available
  if (asset.mirrorUrl) {
    candidateUrls.push({ label: "Boondit Mirror", url: asset.mirrorUrl });
  }

  // Priority 2: Server-side proxy (bypasses CORS, handles GitHub API)
  if (version) {
    candidateUrls.push({ 
      label: "Boondit Proxy", 
      url: `${getProxyBase()}/api/firmware/download?version=${encodeURIComponent(version)}`
    });
  }

  // Priority 3: Proxy with direct GitHub URL (as fallback)
  if (asset.url) {
    candidateUrls.push({
      label: "GitHub via Proxy",
      url: `${getProxyBase()}/api/firmware/download?url=${encodeURIComponent(asset.url)}`
    });
  }

  let response: Response | undefined;
  let usedUrl = "";

  for (const candidate of candidateUrls) {
    try {
      console.log(`[Firmware] Trying ${candidate.label}...`);
      response = await fetch(candidate.url, {
        redirect: "follow",
        cache: "no-store",
      });

      if (response.ok) {
        usedUrl = candidate.label;
        console.log(`[Firmware] Using ${usedUrl}`);
        break;
      }

      console.warn(`[Firmware] ${candidate.label} returned ${response.status}`);
      response = undefined;
    } catch (error) {
      console.error(`[Firmware] ${candidate.label} failed:`, error);
      response = undefined;
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Firmware download failed from all sources. Last: ${usedUrl || 'unknown'}`);
  }

  console.log(`[Firmware] Downloading from: ${usedUrl}`);

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
          percentage: (received / contentLength) * 100,
          speed,
          eta,
        });
      }
    }
  }

  const blob = new Blob(chunks, { type: "application/zip" });
  return new File([blob], asset.name, { type: "application/zip" });
}

/**
 * Get the base URL for proxy endpoints
 * Handles localhost, GitHub Codespaces, and production env
 */
function getProxyBase(): string {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Codespaces or remote env
  if (hostname.includes('github.dev') || hostname.includes('githubusercontent.com')) {
    return `${protocol}//${hostname}`;
  }
  
  // Local dev
  if (hostname.includes('localhost')) {
    return `http://localhost:3000`;
  }
  
  // Production or deployed
  return `${protocol}//${hostname}`;
}
