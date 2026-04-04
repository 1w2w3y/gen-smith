export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
export type ImageQuality = "low" | "medium" | "high" | "auto";
export type OutputFormat = "png" | "jpeg" | "webp";
export type Background = "transparent" | "opaque" | "auto";
export type Moderation = "low" | "auto";

export interface ImageGenerateRequest {
  modelId: string;
  prompt: string;
  n: number;
  size: ImageSize;
  quality: ImageQuality;
  outputFormat: OutputFormat;
  outputCompression?: number;
  background: Background;
  moderation: Moderation;
}

export interface GeneratedImage {
  b64_json: string;
  index: number;
}

export interface ImageGenerateResponse {
  images: GeneratedImage[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerateError {
  error: {
    code: string;
    message: string;
  };
}
