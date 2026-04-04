"use client";

import { FluxGenerationForm } from "@/components/image/FluxGenerationForm";
import type { FluxGenerationFormData } from "@/components/image/FluxGenerationForm";
import { ImageOutput } from "@/components/image/ImageOutput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGenerateFluxImage } from "@/hooks/useGenerateFluxImage";
import * as React from "react";

interface ModelOption {
  id: string;
  displayName: string;
}

export default function FluxImagePage() {
  const { images, isLoading, error, generate } = useGenerateFluxImage();
  const [models, setModels] = React.useState<ModelOption[]>([]);
  const [configError, setConfigError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config");
        const config = await response.json();

        if (!response.ok) {
          throw new Error(config.error?.message || "Failed to load config");
        }

        const fluxImageConfig = config.models?.["flux-image"];
        if (fluxImageConfig?.enabled && fluxImageConfig.models?.length > 0) {
          setModels(fluxImageConfig.models);
        } else {
          setConfigError(
            "No FLUX Image models configured. Please add models to config.json."
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load config";
        setConfigError(message);
      }
    }

    loadConfig();
  }, []);

  const handleGenerate = React.useCallback(
    (data: FluxGenerationFormData) => {
      generate({
        modelId: data.modelId,
        prompt: data.prompt,
        n: data.n,
        width: data.width,
        height: data.height,
      });
    },
    [generate]
  );

  if (configError) {
    return (
      <main className="mx-auto max-w-7xl p-4 pt-8">
        <Alert variant="destructive">
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (models.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl items-center justify-center">
        <p className="text-muted-foreground">Loading configuration...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Form */}
        <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col">
          <FluxGenerationForm
            models={models}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </div>

        {/* Right column: Output */}
        <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ImageOutput images={images} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
