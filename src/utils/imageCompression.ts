/**
 * Compress an image data URL to reduce file size for storage
 * Uses canvas to re-encode the image at a lower quality
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }

          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to data URL with reduced quality
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = dataUrl;
  });
}

/**
 * Get the size of a data URL in kilobytes
 */
export function getDataUrlSizeKB(dataUrl: string): number {
  // Base64 encoded string is about 33% larger than original
  // Formula: (length * 3) / 4 gives approximate byte size
  const sizeInBytes = (dataUrl.length * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}
