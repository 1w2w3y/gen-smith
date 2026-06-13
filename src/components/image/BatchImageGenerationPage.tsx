"use client";

import { ImageOutput } from "@/components/image/ImageOutput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useConfig } from "@/hooks/useConfig";
import { cn } from "@/lib/utils";
import type {
  SanitizedAppConfig,
  SanitizedModelConfig,
} from "@/types/config";
import { CheckSquare, Loader2, Square } from "lucide-react";
import * as React from "react";

type ImageFamilyKey = "gpt-image" | "mai-image" | "flux-image";
type GenerationStatus = "idle" | "loading" | "success" | "error";

interface BatchModel {
  familyKey: ImageFamilyKey;
  familyName: string;
  model: SanitizedModelConfig;
}

interface ImageInfo {
  b64_json: string;
  index: number;
  format: string;
}

interface ModelResult {
  modelKey: string;
  status: GenerationStatus;
  images: ImageInfo[] | null;
  error: string | null;
}

const IMAGE_FAMILIES: ImageFamilyKey[] = [
  "gpt-image",
  "mai-image",
  "flux-image",
];

function getModelKey(familyKey: ImageFamilyKey, modelId: string) {
  return `${familyKey}:${modelId}`;
}

function getAvailableModels(config: SanitizedAppConfig | null): BatchModel[] {
  if (!config) return [];

  return IMAGE_FAMILIES.flatMap((familyKey) => {
    const family = config.models[familyKey];
    if (!family?.enabled || family.models.length === 0) return [];

    return family.models.map((model) => ({
      familyKey,
      familyName: family.displayName,
      model,
    }));
  });
}

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message || `Request failed with status ${response.status}`
    );
  }

  if (!result.images || result.images.length === 0) {
    throw new Error("No images returned from API");
  }

  return result.images as { b64_json: string; index: number }[];
}

async function generateForModel(model: BatchModel, prompt: string) {
  if (model.familyKey === "gpt-image") {
    const images = await postJson("/api/image/generate", {
      modelId: model.model.id,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
      outputFormat: "png",
      background: "auto",
      moderation: "auto",
    });
    return images.map((img) => ({ ...img, format: "png" }));
  }

  const path =
    model.familyKey === "mai-image"
      ? "/api/image/mai/generate"
      : "/api/image/flux/generate";

  const images = await postJson(path, {
    modelId: model.model.id,
    prompt,
    n: 1,
    width: 1024,
    height: 1024,
  });

  return images.map((img) => ({ ...img, format: "png" }));
}

export function BatchImageGenerationPage() {
  const { t } = useLanguage();
  const { config, error: configError, isLoading: isConfigLoading } = useConfig();
  const availableModels = React.useMemo(
    () => getAvailableModels(config),
    [config]
  );
  const [prompt, setPrompt] = React.useState("");
  const [selectedModelKeys, setSelectedModelKeys] = React.useState<string[]>(
    []
  );
  const [results, setResults] = React.useState<Record<string, ModelResult>>({});
  const [isGenerating, setIsGenerating] = React.useState(false);

  const availableModelKeys = React.useMemo(
    () =>
      availableModels.map((model) =>
        getModelKey(model.familyKey, model.model.id)
      ),
    [availableModels]
  );

  React.useEffect(() => {
    setSelectedModelKeys(availableModelKeys);
  }, [availableModelKeys]);

  const selectedModels = React.useMemo(
    () =>
      availableModels.filter((model) =>
        selectedModelKeys.includes(getModelKey(model.familyKey, model.model.id))
      ),
    [availableModels, selectedModelKeys]
  );

  const allSelected =
    availableModels.length > 0 &&
    availableModelKeys.every((modelKey) =>
      selectedModelKeys.includes(modelKey)
    );

  const toggleModel = (modelKey: string) => {
    setSelectedModelKeys((current) =>
      current.includes(modelKey)
        ? current.filter((key) => key !== modelKey)
        : [...current, modelKey]
    );
  };

  const toggleAll = () => {
    setSelectedModelKeys(allSelected ? [] : availableModelKeys);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || selectedModels.length === 0) return;

    const initialResults: Record<string, ModelResult> = Object.fromEntries(
      selectedModels.map((model) => {
        const modelKey = getModelKey(model.familyKey, model.model.id);
        return [
          modelKey,
          { modelKey, status: "loading" as const, images: null, error: null },
        ];
      })
    );

    setResults(initialResults);
    setIsGenerating(true);

    await Promise.all(
      selectedModels.map(async (model) => {
        const modelKey = getModelKey(model.familyKey, model.model.id);
        try {
          const images = await generateForModel(model, prompt.trim());
          setResults((current) => ({
            ...current,
            [modelKey]: {
              modelKey,
              status: "success",
              images,
              error: null,
            },
          }));
        } catch (err: unknown) {
          setResults((current) => ({
            ...current,
            [modelKey]: {
              modelKey,
              status: "error",
              images: null,
              error:
                err instanceof Error
                  ? err.message
                  : "An unexpected error occurred",
            },
          }));
        }
      })
    );

    setIsGenerating(false);
  };

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

  if (isConfigLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </main>
    );
  }

  if (availableModels.length === 0) {
    return (
      <main className="mx-auto max-w-7xl p-4 pt-8">
        <Alert>
          <AlertTitle>{t("batchImage.noModelsTitle")}</AlertTitle>
          <AlertDescription>{t("batchImage.noModelsDesc")}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit shadow-sm lg:sticky lg:top-20">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg">{t("batchImage.title")}</CardTitle>
            <CardDescription>{t("batchImage.desc")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 p-4">
              <div className="space-y-2">
                <Label htmlFor="batch-prompt">{t("common.prompt")}</Label>
                <Textarea
                  id="batch-prompt"
                  placeholder={t("common.promptPlaceholder")}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  required
                  disabled={isGenerating}
                  className="min-h-[140px]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("batchImage.models")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                    disabled={isGenerating}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {allSelected
                      ? t("batchImage.clearAll")
                      : t("batchImage.selectAll")}
                  </Button>
                </div>

                <div className="space-y-2">
                  {availableModels.map((model) => {
                    const modelKey = getModelKey(
                      model.familyKey,
                      model.model.id
                    );
                    const isSelected = selectedModelKeys.includes(modelKey);

                    return (
                      <label
                        key={modelKey}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          isSelected
                            ? "border-primary/60 bg-accent/70"
                            : "border-border bg-background hover:bg-accent/40",
                          isGenerating && "cursor-not-allowed opacity-70"
                        )}
                      >
                        <input
                          type="checkbox"
                          aria-label={`${model.model.displayName} ${model.familyName}`}
                          checked={isSelected}
                          onChange={() => toggleModel(modelKey)}
                          disabled={isGenerating}
                          className="mt-1 h-4 w-4 accent-primary"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {model.model.displayName}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {model.familyName}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/60 p-4">
              <Button
                type="submit"
                disabled={
                  isGenerating ||
                  !prompt.trim() ||
                  selectedModels.length === 0
                }
                className="w-full"
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isGenerating
                  ? t("common.generating")
                  : t("batchImage.generate")}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <section className="min-h-[calc(100vh-5rem)]">
          {selectedModels.length === 0 ? (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground">
              <p>{t("batchImage.emptySelection")}</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {selectedModels.map((model) => {
                const modelKey = getModelKey(model.familyKey, model.model.id);
                const result = results[modelKey];
                const status = result?.status ?? "idle";

                return (
                  <div key={modelKey} className="space-y-3">
                    <div className="flex min-h-12 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold">
                          {model.model.displayName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {model.familyName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                          status === "success" &&
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          status === "error" &&
                            "border-destructive/40 bg-destructive/10 text-destructive",
                          status === "loading" &&
                            "border-primary/40 bg-primary/10 text-primary",
                          status === "idle" &&
                            "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {t(`batchImage.status.${status}`)}
                      </span>
                    </div>

                    {result?.error && (
                      <Alert variant="destructive">
                        <AlertTitle>{t("common.error")}</AlertTitle>
                        <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="h-[360px]">
                      <ImageOutput
                        images={result?.images ?? null}
                        isLoading={status === "loading"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
