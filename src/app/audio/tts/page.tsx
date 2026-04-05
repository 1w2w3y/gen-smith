"use client";

import { TTSForm } from "@/components/audio/TTSForm";
import type { TTSFormData } from "@/components/audio/TTSForm";
import { AudioOutput } from "@/components/audio/AudioOutput";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGenerateSpeech } from "@/hooks/useGenerateSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useLanguage } from "@/components/layout/LanguageProvider";
import type { HistoryEntry, TTSHistoryEntry } from "@/types/history";
import * as React from "react";

interface ModelOption {
  id: string;
  displayName: string;
}

export default function TTSPage() {
  const { audioUrl, format, isLoading, error, generate } =
    useGenerateSpeech();
  const history = useHistory("tts");
  const [models, setModels] = React.useState<ModelOption[]>([]);
  const [configError, setConfigError] = React.useState<string | null>(null);
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = React.useState<"output" | "history">("output");
  const [formKey, setFormKey] = React.useState(0);
  const [formDefaults, setFormDefaults] = React.useState<Partial<TTSFormData> | undefined>();

  const latestParamsRef = React.useRef<TTSFormData | null>(null);
  const prevLoadingRef = React.useRef(false);

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config");
        const config = await response.json();

        if (!response.ok) {
          throw new Error(config.error?.message || "Failed to load config");
        }

        const ttsConfig = config.models?.["tts"];
        if (ttsConfig?.enabled && ttsConfig.models?.length > 0) {
          setModels(ttsConfig.models);
        } else {
          setConfigError(t("tts.configError"));
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
    if (prevLoadingRef.current && !isLoading && audioUrl && latestParamsRef.current) {
      const params = latestParamsRef.current;
      history.addTTSEntry(params);
      latestParamsRef.current = null;
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, audioUrl, history]);

  const handleGenerate = React.useCallback(
    (data: TTSFormData) => {
      latestParamsRef.current = data;
      setActiveTab("output");
      generate({
        modelId: data.modelId,
        input: data.input,
        voice: data.voice,
        speed: data.speed,
        responseFormat: data.responseFormat,
        instructions: data.instructions,
      });
    },
    [generate]
  );

  const handleRestore = React.useCallback((entry: HistoryEntry) => {
    const e = entry as TTSHistoryEntry;
    setFormDefaults(e.params);
    setFormKey((k) => k + 1);
  }, []);

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
          <TTSForm
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
            <AudioOutput
              audioUrl={audioUrl}
              format={format}
              isLoading={isLoading}
            />
          ) : (
            <HistoryPanel
              entries={history.entries}
              isLoading={history.isLoading}
              onRestore={handleRestore}
              onDelete={history.removeEntry}
              onClearAll={history.clearAll}
            />
          )}
        </div>
      </div>
    </main>
  );
}
