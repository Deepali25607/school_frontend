// Image helpers for inline (base64) photo attachments.
//
// The app stores images as data URLs (no external file store), so we resize
// and compress on the client before upload to keep payloads small and within
// the server's per-image cap.

/**
 * Resize an image File to a JPEG data URL, preserving aspect ratio (no crop).
 * If the encoded result still exceeds `maxBytes`, quality is stepped down until
 * it fits or hits a quality floor.
 *
 * @returns {Promise<string>} data:image/jpeg;base64,... URL
 */
export function resizeImageToDataURL(
  file,
  { maxSize = 1400, quality = 0.82, maxBytes = 1024 * 1024 } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Please pick an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Couldn't read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        let q = quality;
        let out = canvas.toDataURL("image/jpeg", q);
        // Step quality down until it fits the byte budget (floor at 0.4).
        while (out.length > maxBytes && q > 0.4) {
          q -= 0.12;
          out = canvas.toDataURL("image/jpeg", q);
        }
        if (out.length > maxBytes) {
          reject(new Error("Image is too large even after compression — try a smaller photo"));
          return;
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Trigger a file download for a data URL. Uses a Blob + object URL so it works
 * in browsers and the Android webview (anchor `download` on a raw data: URL is
 * unreliable there).
 */
export function downloadDataUrl(dataUrl, filename = "image.jpg") {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke after a tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    // Fallback: open in a new tab so the user can long-press / save manually.
    window.open(dataUrl, "_blank");
  }
}
