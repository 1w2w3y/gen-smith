"use client";

import { useState, useCallback } from "react";
import type { GeneratedImage } from "@/types/image";
import { trackClientEvent } from "@/lib/telemetry-browser";

interface UseGenerateImageResult {
  images: (GeneratedImage & { format: string })[] | null;
  isLoading: boolean;
  error: string | null;
  generate: (params: {
    modelId: string;
    prompt: string;
    n: number;
    size: string;
    quality: string;
    outputFormat: string;
    outputCompression?: number;
    background: string;
    moderation: string;
  }) => Promise<void>;
}

export function useGenerateImage(): UseGenerateImageResult {
  const [images, setImages] = useState<
    (GeneratedImage & { format: string })[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      modelId: string;
      prompt: string;
      n: number;
      size: string;
      quality: string;
      outputFormat: string;
      outputCompression?: number;
      background: string;
      moderation: string;
    }) => {
      setIsLoading(true);
      setError(null);
      setImages(null);

      const startTime = Date.now();
      try {
        const response = await fetch("/api/image/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message || `Request failed with status ${response.status}`
          );
        }

        if (result.images && result.images.length > 0) {
          setImages(
            result.images.map(
              (img: { b64_json: string; index: number }) => ({
                ...img,
                format: params.outputFormat,
              })
            )
          );
          trackClientEvent("ClientImageGeneration", {
            modelId: params.modelId,
            prompt: params.prompt,
            size: params.size,
            quality: params.quality,
            outputFormat: params.outputFormat,
            background: params.background,
            imageCount: String(params.n),
          }, {
            durationMs: Date.now() - startTime,
            promptLength: params.prompt.length,
          });
        } else {
          throw new Error("No images returned from API");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        setImages(null);
        trackClientEvent("ClientImageGenerationError", {
          modelId: params.modelId,
          errorMessage: message,
        }, {
          durationMs: Date.now() - startTime,
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { images, isLoading, error, generate };
}
