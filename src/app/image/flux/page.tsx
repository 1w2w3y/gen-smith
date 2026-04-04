"use client";

import { FluxGenerationForm } from "@/components/image/FluxGenerationForm";
import type { FluxGenerationFormData } from "@/components/image/FluxGenerationForm";
import { ImageOutput } from "@/components/image/ImageOutput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGenerateFluxImage } from "@/hooks/useGenerateFluxImage";
import { useLanguage } from "@/components/layout/LanguageProvider";
import * as React from "react";

interface ModelOption {
  id: string;
  displayName: string;
}

export default function FluxImagePage() {
  const { images, isLoading, error, generate } = useGenerateFluxImage();
  const [models, setModels] = React.useState<ModelOption[]>([]);
  const [configError, setConfigError] = React.useState<string | null>(null);
  const { t } = useLanguage();

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
          setConfigError(t("flux.configError"));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load config";
        setConfigError(message);
      }
    }

    loadConfig();
  }, [t]);

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
          <AlertTitle>{t("common.configError")}</AlertTitle>
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (models.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col">
          <FluxGenerationForm
            models={models}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </div>
        <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t("common.error")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ImageOutput images={images} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
