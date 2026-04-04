export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav";

export interface TTSGenerateRequest {
  modelId: string;
  input: string;
  voice: TTSVoice;
  speed?: number;
  responseFormat?: TTSFormat;
  instructions?: string;
}
