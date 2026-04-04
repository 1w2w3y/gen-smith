"use client";

import { useState, useCallback } from "react";
import type { GeneratedImage } from "@/types/image";

interface UseGenerateFluxImageResult {
  images: (GeneratedImage & { format: string })[] | null;
  isLoading: boolean;
  error: string | null;
  generate: (params: {
    modelId: string;
    prompt: string;
    width: number;
    height: number;
    n: number;
  }) => Promise<void>;
}

export function useGenerateFluxImage(): UseGenerateFluxImageResult {
  const [images, setImages] = useState<
    (GeneratedImage & { format: string })[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      modelId: string;
      prompt: string;
      width: number;
      height: number;
      n: number;
    }) => {
      setIsLoading(true);
      setError(null);
      setImages(null);

      try {
        const response = await fetch("/api/image/flux/generate", {
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

        if (result.images && result.images.length > 0) {
          setImages(
            result.images.map(
              (img: { b64_json: string; index: number }) => ({
                ...img,
                format: "png",
              })
            )
          );
        } else {
          throw new Error("No images returned from API");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        setImages(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { images, isLoading, error, generate };
}
