export type ImageFormat = "png" | "jpeg" | "webp";

export function detectBase64ImageFormat(b64Json: string): ImageFormat {
  if (b64Json.startsWith("/9j/")) return "jpeg";
  if (b64Json.startsWith("UklGR")) return "webp";
  return "png";
}
