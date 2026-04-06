import type { TTSVoice, TTSFormat } from "./tts";
import type { ImageSize, ImageQuality, OutputFormat, Background, Moderation } from "./image";

export type PlaygroundType = "gpt-image" | "mai-image" | "flux-image" | "tts";

interface HistoryEntryBase {
  id: string;
  playground: PlaygroundType;
  createdAt: number;
}

export interface GptImageHistoryEntry extends HistoryEntryBase {
  playground: "gpt-image";
  params: {
    modelId: string;
    prompt: string;
    n: number;
    size: ImageSize;
    quality: ImageQuality;
    outputFormat: OutputFormat;
    outputCompression?: number;
    background: Background;
    moderation: Moderation;
  };
  thumbnails: string[];
  imageCount: number;
}

export interface FluxImageHistoryEntry extends HistoryEntryBase {
  playground: "flux-image";
  params: {
    modelId: string;
    prompt: string;
    n: number;
    width: number;
    height: number;
  };
  thumbnails: string[];
  imageCount: number;
}

export interface MaiImageHistoryEntry extends HistoryEntryBase {
  playground: "mai-image";
  params: {
    modelId: string;
    prompt: string;
    n: number;
    width: number;
    height: number;
  };
  thumbnails: string[];
  imageCount: number;
}

export interface TTSHistoryEntry extends HistoryEntryBase {
  playground: "tts";
  params: {
    modelId: string;
    input: string;
    voice: TTSVoice;
    speed?: number;
    responseFormat: TTSFormat;
    instructions?: string;
  };
}

export type HistoryEntry =
  | GptImageHistoryEntry
  | MaiImageHistoryEntry
  | FluxImageHistoryEntry
  | TTSHistoryEntry;

export interface HistoryImageRecord {
  historyId: string;
  index: number;
  b64_json: string;
  format: string;
}
