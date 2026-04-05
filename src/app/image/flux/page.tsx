"use client";

import { FluxGenerationForm } from "@/components/image/FluxGenerationForm";
import type { FluxGenerationFormData } from "@/components/image/FluxGenerationForm";
import { ImageOutput } from "@/components/image/ImageOutput";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGenerateFluxImage } from "@/hooks/useGenerateFluxImage";
import { useHistory } from "@/hooks/useHistory";
import { useLanguage } from "@/components/layout/LanguageProvider";
import type { HistoryEntry, FluxImageHistoryEntry } from "@/types/history";
import * as React from "react";

interface ModelOption {
  id: string;
  displayName: string;
}

export default function FluxImagePage() {
  const { images, isLoading, error, generate } = useGenerateFluxImage();
  const history = useHistory("flux-image");
  const [models, setModels] = React.useState<ModelOption[]>([]);
  const [configError, setConfigError] = React.useState<string | null>(null);
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = React.useState<"output" | "history">("output");
  const [formKey, setFormKey] = React.useState(0);
  const [formDefaults, setFormDefaults] = React.useState<Partial<FluxGenerationFormData> | undefined>();

  const latestParamsRef = React.useRef<FluxGenerationFormData | null>(null);
  const prevLoadingRef = React.useRef(false);

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

  // Save to history when generation completes
  React.useEffect(() => {
    if (prevLoadingRef.current && !isLoading && images && images.length > 0 && latestParamsRef.current) {
      const params = latestParamsRef.current;
      history.addImageEntry(params, images);
      latestParamsRef.current = null;
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, images, history]);

  const handleGenerate = React.useCallback(
    (data: FluxGenerationFormData) => {
      latestParamsRef.current = data;
      setActiveTab("output");
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

  const handleRestore = React.useCallback((entry: HistoryEntry) => {
    const e = entry as FluxImageHistoryEntry;
    setFormDefaults(e.params);
    setFormKey((k) => k + 1);
  }, []);

  const handleViewImages = React.useCallback(
    async (historyId: string) => {
      const fullImages = await history.getFullImages(historyId);
      if (fullImages.length > 0) {
        setViewedImages(
          fullImages.map((img) => ({
            b64_json: img.b64_json,
            index: img.index,
            format: img.format,
          }))
        );
        setActiveTab("output");
      }
    },
    [history]
  );

  const [viewedImages, setViewedImages] = React.useState<
    { b64_json: string; index: number; format: string }[] | null
  >(null);

  React.useEffect(() => {
    if (isLoading) setViewedImages(null);
  }, [isLoading]);

  const displayImages = viewedImages ?? images;

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
            key={formKey}
            models={models}
            onSubmit={handleGenerate}
            isLoading={isLoading}
            defaultValues={formDefaults}
          />
        </div>
        <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col">
          <div className="mb-3 flex gap-1.5">
            <Button
              variant={activeTab === "output" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("output")}
            >
              {t("history.output")}
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("history")}
            >
              {t("history.title")}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t("common.error")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {activeTab === "output" ? (
            <ImageOutput images={displayImages} isLoading={isLoading} />
          ) : (
            <HistoryPanel
              entries={history.entries}
              isLoading={history.isLoading}
              onRestore={handleRestore}
              onDelete={history.removeEntry}
              onClearAll={history.clearAll}
              onViewImages={handleViewImages}
            />
          )}
        </div>
      </div>
    </main>
  );
}
