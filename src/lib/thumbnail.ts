const THUMB_SIZE = 150;
const THUMB_QUALITY = 0.6;

export function generateThumbnail(
  b64_json: string,
  format: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(THUMB_SIZE / img.width, THUMB_SIZE / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", THUMB_QUALITY);
      // Strip the data:image/jpeg;base64, prefix to store raw base64
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    img.onerror = () => reject(new Error("Failed to load image for thumbnail"));
    img.src = `data:image/${format};base64,${b64_json}`;
  });
}

export async function generateThumbnails(
  images: { b64_json: string; format: string }[]
): Promise<string[]> {
  return Promise.all(
    images.map((img) => generateThumbnail(img.b64_json, img.format))
  );
}
