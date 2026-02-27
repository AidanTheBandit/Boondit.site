import type { APIRoute } from 'astro';

/**
 * Server-side proxy for downloading Rabbit R1 firmware
 * Bypasses CORS restrictions by downloading on the server and streaming to client
 */
export const GET: APIRoute = async ({ request, url }) => {
  const version = url.searchParams.get('version');
  
  if (!version) {
    return new Response(JSON.stringify({ error: 'Missing version parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const filename = `rabbit_OS_${version}.zip`;
  
  try {
    // Step 1: Get asset URL from GitHub API
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
    const asset = releaseData.assets?.find((a: any) => a.name === filename);

    if (!asset) {
      console.error(`[Proxy] Asset not found: ${filename}`);
      return new Response(JSON.stringify({ 
        error: `Firmware file ${filename} not found in release` 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Proxy] Found asset: ${asset.name} (${asset.size} bytes)`);
    console.log(`[Proxy] Downloading from: ${asset.browser_download_url}`);

    // Step 2: Download the firmware file
    const downloadResponse = await fetch(asset.browser_download_url, {
      headers: {
        'User-Agent': 'Boondit-R1-Flash-Utility'
      }
    });

    if (!downloadResponse.ok) {
      console.error(`[Proxy] Download failed: ${downloadResponse.status}`);
      return new Response(JSON.stringify({ 
        error: `Download failed with status ${downloadResponse.status}` 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Stream the response to the client with CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
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
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
