// Metadata fetching functionality
import { updateJsonPreview } from './form-handlers.js';
import { generateQRRealtime } from './qr-generator.js';
export const getBestIcon = (doc, baseUrl) => {
  // Priority order for icons
  const iconSelectors = [
    'link[rel="apple-touch-icon"][sizes="180x180"]',
    'link[rel="apple-touch-icon"][sizes="152x152"]',
    'link[rel="apple-touch-icon"][sizes="120x120"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="icon"][sizes="192x192"]',
    'link[rel="icon"][sizes="128x128"]',
    'link[rel="icon"][sizes="96x96"]',
    'link[rel="icon"][sizes="64x64"]',
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'meta[property="og:image"]'
  ];

  for (const selector of iconSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const href = element.getAttribute('content') || element.getAttribute('href');
      if (href) {
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return href;
        }
      }
    }
  }

  return '';
};

export const fetchMetadata = async (elements) => {
  const url = elements.url?.value;
  if (!url) {
    alert('Please enter a URL first');
    return;
  }

  const btn = elements.fetchMetadataBtn;
  btn.disabled = true;
  btn.textContent = 'Fetching...';

  try {
    // Try multiple proxy services in order of preference
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.org/?${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    let htmlContent = null;
    let doc = null;
    let lastError = null;

    for (const proxyUrl of proxies) {
      try {
        console.log(`Trying proxy: ${proxyUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(proxyUrl, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Proxy ${proxyUrl} returned ${response.status}`);
          continue;
        }

        // Handle different response types
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.contents) {
            htmlContent = data.contents;
          } else if (data.body || data.content) {
            htmlContent = data.body || data.content;
          }
        } else {
          htmlContent = await response.text();
        }

        if (htmlContent) {
          const parser = new DOMParser();
          doc = parser.parseFromString(htmlContent, 'text/html');

          // Test if parsing worked
          if (doc.body && (doc.querySelector('title') || doc.querySelector('head'))) {
            console.log(`Success with proxy: ${proxyUrl}`);
            break; // Success! Use this proxy
          } else {
            console.warn(`Invalid HTML from proxy: ${proxyUrl}`);
            htmlContent = null;
            doc = null;
          }
        }
      } catch (proxyError) {
        console.warn(`Proxy ${proxyUrl} failed:`, proxyError.message);
        lastError = proxyError;
        continue;
      }
    }

    if (!htmlContent || !doc) {
      throw lastError || new Error('All proxy services failed to return valid content');
    }

    // Extract metadata
    const metadata = {
      title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
             doc.querySelector('title')?.textContent || '',
      description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                  doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      iconUrl: getBestIcon(doc, url),
      author: doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
             doc.querySelector('meta[property="article:author"]')?.getAttribute('content') || '',
      themeColor: doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') ||
                 doc.querySelector('meta[name="msapplication-TileColor"]')?.getAttribute('content') ||
                 doc.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content') || '#FE5000'
    };

    // Update inputs
    if (metadata.title && elements.title) elements.title.value = metadata.title;
    if (metadata.description && elements.description) elements.description.value = metadata.description;
    if (metadata.iconUrl && elements.iconUrl) {
      try {
        elements.iconUrl.value = new URL(metadata.iconUrl, url).href;
      } catch { elements.iconUrl.value = metadata.iconUrl; }
    }
    if (metadata.author && elements.author) elements.author.value = metadata.author;
    if (metadata.themeColor && elements.themeColor) {
      elements.themeColor.value = metadata.themeColor;
      elements.themeColorText.value = metadata.themeColor;
      // Dispatch change event to trigger real-time updates
      elements.themeColor.dispatchEvent(new Event('change'));
    }

    updateJsonPreview(elements);

    // Trigger QR code regeneration with new metadata
    setTimeout(() => generateQRRealtime(elements), 500);
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    // Check if we extracted any useful metadata
    const hasMetadata = elements.title?.value || elements.description?.value || elements.iconUrl?.value || elements.author?.value;

    if (!hasMetadata) {
      alert(`Failed to fetch metadata: ${error.message}`);
    } else {
      console.log('Metadata fetch completed with some data despite errors');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Fetch Metadata';
  }
};