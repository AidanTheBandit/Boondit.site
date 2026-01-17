// Form handling utilities and event management
export const getElements = () => ({
  url: document.getElementById("url"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  author: document.getElementById("author"),
  iconUrl: document.getElementById("iconUrl"),
  screenshotUrl: document.getElementById("screenshotUrl"),
  themeColor: document.getElementById("themeColor"),
  themeColorText: document.getElementById("themeColorText"),
  qrBgColor: document.getElementById("qrBgColor"),
  qrBgColorText: document.getElementById("qrBgColorText"),
  qrDotsStyle: document.getElementById("qrDotsStyle"),
  qrCornerSquareStyle: document.getElementById("qrCornerSquareStyle"),
  qrCornerDotStyle: document.getElementById("qrCornerDotStyle"),
  fetchMetadataBtn: document.getElementById("fetchMetadata"),
  takeScreenshotBtn: document.getElementById("takeScreenshot"),
  downloadQRBtn: document.getElementById("downloadQR"),
  qrCodeWrapper: document.getElementById("qrCodeWrapper"),
  screenshotWrapper: document.getElementById("screenshotWrapper"),
  jsonPreview: document.getElementById("jsonPreview"),
});

export const getFormData = (elements) => ({
  title: elements.title?.value || "",
  url: elements.url?.value || "",
  description: elements.description?.value || "",
  iconUrl: elements.iconUrl?.value || "",
  themeColor: elements.themeColor?.value || "#FE5000",
  author: elements.author?.value || "",
  screenshotUrl: elements.screenshotUrl?.value || "",
});

// Update Functions
export const updateJsonPreview = (elements) => {
  const data = getFormData(elements);
  if (elements.jsonPreview) {
    elements.jsonPreview.textContent = JSON.stringify(data, null, 2);
  }
};

export const updateScreenshotPreview = (elements) => {
  const url = elements.screenshotUrl?.value || "";
  if (!elements.screenshotWrapper) return;

  if (url) {
    elements.screenshotWrapper.innerHTML = `
      <img
        src="${url}"
        alt="Screenshot preview"
        class="max-w-full rounded-lg object-contain"
        onerror="this.parentElement.innerHTML='<p class=\\'text-red-400 text-center\\'>Failed to load screenshot</p>'"
      />`;
  } else {
    elements.screenshotWrapper.innerHTML =
      '<p class="preview-placeholder">Enter a screenshot URL</p>';
  }
};

// Color Sync
export const syncColorInputs = (colorInput, textInput, callback) => {
  if (!colorInput || !textInput) return;

  colorInput.addEventListener("input", () => {
    textInput.value = colorInput.value;
    callback?.();
  });
  colorInput.addEventListener("change", () => {
    textInput.value = colorInput.value;
    callback?.();
  });

  textInput.addEventListener("input", () => {
    colorInput.value = textInput.value;
    callback?.();
  });
  textInput.addEventListener("change", () => {
    colorInput.value = textInput.value;
    callback?.();
  });
};
