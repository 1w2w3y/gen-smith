export type TTSVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "cedar"
  | "coral"
  | "echo"
  | "fable"
  | "marin"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer"
  | "verse";

export type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav";

export const TTS_VOICES: readonly TTSVoice[] = [
  "alloy",
  "ash",
  "ballad",
  "cedar",
  "coral",
  "echo",
  "fable",
  "marin",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
];

export const TTS_FORMATS: readonly TTSFormat[] = ["mp3", "opus", "aac", "flac", "wav"];
