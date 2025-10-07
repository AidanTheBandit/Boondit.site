// QR code generation functionality
import { getFormData } from './form-handlers.js';

let generatedQRCode = null;

export const generateQR = async (elements) => {
  const data = getFormData(elements);
  if (!data.url) {
    alert('Please enter a URL');
    return;
  }

  const btn = elements.generateQRBtn;
  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    await generateQRRealtime(elements);
    elements.downloadQRBtn.disabled = false;
  } catch (error) {
    console.error('QR generation failed:', error);
    alert('Failed to generate QR code: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate QR Code';
  }
};

// Real-time QR Generator (no validation, no UI updates)
export const generateQRRealtime = async (elements) => {
  const data = getFormData(elements);
  if (!data.url) return; // Skip if no URL

  const qrDataString = JSON.stringify(data);
  const themeColor = elements.themeColor?.value || '#FE5000';
  const options = {
    dotsType: elements.qrDotsStyle?.value || 'rounded',
    cornerSquareType: elements.qrCornerSquareStyle?.value || 'dot',
    cornerDotType: elements.qrCornerDotStyle?.value || 'dot',
    bgColor: elements.qrBgColor?.value || '#FFFFFF',
    fgColor: themeColor,
    logoUrl: elements.iconUrl?.value || ''
  };

  // Create themed background based on theme color
  const createThemedBackground = (themeColor) => {
    // Convert hex to RGB
    const hex = themeColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create a very light tint of the theme color for background
    const tintFactor = 0.95; // Very subtle tint
    const tintedR = Math.round(r + (255 - r) * tintFactor);
    const tintedG = Math.round(g + (255 - g) * tintFactor);
    const tintedB = Math.round(b + (255 - b) * tintFactor);

    return `rgb(${tintedR}, ${tintedG}, ${tintedB})`;
  };

  // Use themed background if no custom background is set
  const qrBackgroundColor = options.bgColor === '#FFFFFF' ? createThemedBackground(themeColor) : options.bgColor;

  // Create canvas for watermarked QR code
  const canvas = document.createElement('canvas');
  canvas.width = 340;
  canvas.height = 380;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = qrBackgroundColor;
  ctx.fillRect(0, 0, 340, 380);

  // Generate QR code data URL
  let qrImageSrc;
  console.log('QRCodeStyling available:', !!window.QRCodeStyling);
  console.log('Theme color:', themeColor);
  if (window.QRCodeStyling) {
    console.log('Using QRCodeStyling library');
    const qrCode = new window.QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: qrDataString,
      margin: 10,
      qrOptions: { errorCorrectionLevel: "H" },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.5, margin: 4 },
      dotsOptions: { color: themeColor, type: options.dotsType },
      backgroundOptions: { color: qrBackgroundColor },
      cornersSquareOptions: { color: themeColor, type: options.cornerSquareType },
      cornersDotOptions: { color: themeColor, type: options.cornerDotType },
      ...(options.logoUrl && { image: options.logoUrl })
    });

    qrImageSrc = await new Promise((resolve) => {
      qrCode.getRawData('png').then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });
  } else {
    console.log('Falling back to API');
    // Fallback to API with theme color
    const fgColorHex = themeColor.replace('#', '');
    qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataString)}&color=${fgColorHex}`;
  }

  // Draw QR code on canvas
  const qrImage = new Image();
  qrImage.crossOrigin = 'anonymous';
  qrImage.onload = function() {
    // Center QR code
    ctx.drawImage(qrImage, 20, 20, 300, 300);

    // Watermark
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';

    const creationName = elements.title?.value || '';
    const watermarkText = creationName ? `${creationName} | boondit.site` : 'boondit.site';
    ctx.fillText(watermarkText, 170, 355);

    // Update preview
    elements.qrCodeWrapper.innerHTML = '';
    elements.qrCodeWrapper.appendChild(canvas);

    // Store for download
    generatedQRCode = canvas.toDataURL('image/png');
    elements.downloadQRBtn.disabled = false;
  };

  qrImage.src = qrImageSrc;
};

// Download QR
export const downloadQR = (elements) => {
  if (!generatedQRCode) {
    alert('Please wait for QR code generation to complete');
    return;
  }

  const link = document.createElement('a');
  link.download = 'boondit-qr-code.png';
  link.href = generatedQRCode;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Take Screenshot
export const takeScreenshot = async (elements) => {
  const url = elements.url?.value;
  if (!url) {
    alert('Please enter a URL first');
    return;
  }

  const btn = elements.takeScreenshotBtn;
  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    // Use Thum.io for client-side screenshot generation
    const screenshotUrl = `https://image.thum.io/get/width/240/height/282/${url}`;

    // Update the screenshot URL input
    elements.screenshotUrl.value = screenshotUrl;

    // Update previews
    updateScreenshotPreview(elements);
    updateJsonPreview(elements);

  } catch (error) {
    console.error('Screenshot failed:', error);
    alert('Failed to generate screenshot URL. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Screenshot URL';
  }
};