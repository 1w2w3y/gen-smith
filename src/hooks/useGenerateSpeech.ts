"use client";

import { useState, useCallback } from "react";

interface UseGenerateSpeechResult {
  audioUrl: string | null;
  format: string | null;
  isLoading: boolean;
  error: string | null;
  generate: (params: {
    modelId: string;
    input: string;
    voice: string;
    speed?: number;
    responseFormat?: string;
    instructions?: string;
  }) => Promise<void>;
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    opus: "audio/opus",
    aac: "audio/aac",
    flac: "audio/flac",
    wav: "audio/wav",
  };
  return mimeTypes[format] || "audio/mpeg";
}

export function useGenerateSpeech(): UseGenerateSpeechResult {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      modelId: string;
      input: string;
      voice: string;
      speed?: number;
      responseFormat?: string;
      instructions?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      // Revoke previous audio URL
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setFormat(null);

      try {
        const response = await fetch("/api/audio/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              `Request failed with status ${response.status}`
          );
        }

        if (!result.audio) {
          throw new Error("No audio returned from API");
        }

        // Decode base64 audio to blob URL
        const fmt = result.format || params.responseFormat || "mp3";
        const byteCharacters = atob(result.audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: getMimeType(fmt) });
        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
        setFormat(fmt);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        setAudioUrl(null);
        setFormat(null);
      } finally {
        setIsLoading(false);
      }
    },
    [audioUrl]
  );

  return { audioUrl, format, isLoading, error, generate };
}
