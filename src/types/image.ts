export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
export type ImageQuality = "low" | "medium" | "high" | "auto";
export type OutputFormat = "png" | "jpeg" | "webp";
export type Background = "transparent" | "opaque" | "auto";
export type Moderation = "low" | "auto";

export interface GeneratedImage {
  b64_json: string;
  index: number;
}
