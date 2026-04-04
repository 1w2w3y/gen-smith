"use client";

import { TTSForm } from "@/components/audio/TTSForm";
import type { TTSFormData } from "@/components/audio/TTSForm";
import { AudioOutput } from "@/components/audio/AudioOutput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGenerateSpeech } from "@/hooks/useGenerateSpeech";
import * as React from "react";

interface ModelOption {
  id: string;
  displayName: string;
}

export default function TTSPage() {
  const { audioUrl, format, isLoading, error, generate } =
    useGenerateSpeech();
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

        const ttsConfig = config.models?.["tts"];
        if (ttsConfig?.enabled && ttsConfig.models?.length > 0) {
          setModels(ttsConfig.models);
        } else {
          setConfigError(
            "No TTS models configured. Please add models to config.json."
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
    (data: TTSFormData) => {
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
          <TTSForm
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
          <AudioOutput
            audioUrl={audioUrl}
            format={format}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  );
}
