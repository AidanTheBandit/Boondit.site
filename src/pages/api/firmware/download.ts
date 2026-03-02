import type { APIRoute } from 'astro';

/**
 * Server-side proxy for downloading Rabbit R1 firmware
 * Bypasses CORS restrictions by downloading on the server and streaming to client
 * 
 * Handles multiple input formats:
 * 1. ?version=vX.X.X  → fetches from GitHub API and downloads asset
 * 2. ?url=<direct-url> → directly downloads from provided URL (for mirror fallback)
 */
export const GET: APIRoute = async ({ request, url }) => {
  const version = url.searchParams.get('version');
  const directUrl = url.searchParams.get('url');
  
  if (!version && !directUrl) {
    return new Response(JSON.stringify({ error: 'Missing version or url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let downloadUrl: string;
    let filename: string;

    if (directUrl) {
      // Direct URL provided - use it directly
      downloadUrl = decodeURIComponent(directUrl);
      filename = downloadUrl.split('/').pop() || 'firmware.zip';
      console.log(`[Proxy] Direct download: ${filename}`);
    } else if (version) {
      // Version provided - resolve via GitHub API
      const filename_from_version = `rabbit_OS_${version}.zip`;
      const apiUrl = `https://api.github.com/repos/rabbit-hmi-oss/firmware/releases/tags/${version}`;
      console.log(`[Proxy] Fetching release info from: ${apiUrl}`);
      
      const releaseResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Boondit-R1-Flash-Utility'
        }
      });

      if (!releaseResponse.ok) {
        console.error(`[Proxy] GitHub API error: ${releaseResponse.status}`);
        return new Response(JSON.stringify({ 
          error: `GitHub API returned ${releaseResponse.status}` 
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const releaseData = await releaseResponse.json();
      const asset = releaseData.assets?.find((a: any) => a.name === filename_from_version || a.name.endsWith('.zip'));

      if (!asset) {
        console.error(`[Proxy] Asset not found: ${filename_from_version}`);
        return new Response(JSON.stringify({ 
          error: `Firmware file not found in release ${version}` 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      downloadUrl = asset.browser_download_url;
      filename = asset.name;
      console.log(`[Proxy] Found asset: ${asset.name} (${asset.size} bytes) at ${downloadUrl}`);
    } else {
      throw new Error('No valid download source specified');
    }

    // Step 2: Download the firmware file with retry logic
    let downloadResponse: Response | undefined;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        downloadResponse = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Boondit-R1-Flash-Utility',
            'Accept-Encoding': 'gzip, deflate, br'
          },
          redirect: 'follow'
        });

        if (downloadResponse.ok) {
          break;
        }
        
        console.warn(`[Proxy] Download attempt ${attempts + 1} failed with status ${downloadResponse.status}`);
        attempts++;
        await new Promise(r => setTimeout(r, 1000 * (attempts + 1))); // exponential backoff
      } catch (error) {
        console.warn(`[Proxy] Download attempt ${attempts + 1} error: ${error}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000 * (attempts + 1)));
        }
      }
    }

    if (!downloadResponse?.ok) {
      console.error(`[Proxy] Download failed after ${maxAttempts} attempts`);
      return new Response(JSON.stringify({ 
        error: `Download failed after ${maxAttempts} attempts` 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Stream the response to the client
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // Preserve content length if available
    const contentLength = downloadResponse.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    console.log(`[Proxy] Streaming ${filename} to client...`);

    return new Response(downloadResponse.body, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
