"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/layout/LanguageProvider";
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Loader2,
} from "lucide-react";
import * as React from "react";

export interface FluxGenerationFormData {
  modelId: string;
  prompt: string;
  n: number;
  width: number;
  height: number;
}

interface ModelOption {
  id: string;
  displayName: string;
}

interface FluxGenerationFormProps {
  models: ModelOption[];
  onSubmit: (data: FluxGenerationFormData) => void;
  isLoading: boolean;
}

type DimensionPreset = "1024x1024" | "1536x1024" | "1024x1536" | "768x768";

const RadioItemWithIcon = ({
  value,
  id,
  label,
  Icon,
}: {
  value: string;
  id: string;
  label: string;
  Icon: React.ElementType;
}) => (
  <div className="flex items-center space-x-2">
    <RadioGroupItem value={value} id={id} />
    <Label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Label>
  </div>
);

const DIMENSION_PRESETS: Record<DimensionPreset, { width: number; height: number }> = {
  "1024x1024": { width: 1024, height: 1024 },
  "1536x1024": { width: 1536, height: 1024 },
  "1024x1536": { width: 1024, height: 1536 },
  "768x768": { width: 768, height: 768 },
};

export function FluxGenerationForm({
  models,
  onSubmit,
  isLoading,
}: FluxGenerationFormProps) {
  const { t } = useLanguage();
  const [modelId, setModelId] = React.useState(models[0]?.id ?? "");
  const [prompt, setPrompt] = React.useState("");
  const [n, setN] = React.useState([1]);
  const [dimensionPreset, setDimensionPreset] =
    React.useState<DimensionPreset>("1024x1024");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const preset = DIMENSION_PRESETS[dimensionPreset];
    onSubmit({
      modelId,
      prompt,
      n: n[0],
      width: preset.width,
      height: preset.height,
    });
  };

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-lg">{t("flux.title")}</CardTitle>
        <CardDescription>{t("flux.desc")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-1 flex-col overflow-hidden"
      >
        <CardContent className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label>{t("common.model")}</Label>
            <Select value={modelId} onValueChange={setModelId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectModel")} />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">{t("common.prompt")}</Label>
            <Textarea
              id="prompt"
              placeholder={t("common.promptPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.numImages")}: {n[0]}</Label>
            <Slider min={1} max={4} step={1} value={n} onValueChange={setN} disabled={isLoading} />
          </div>

          <div className="space-y-3">
            <Label>{t("flux.dimensions")}</Label>
            <RadioGroup
              value={dimensionPreset}
              onValueChange={(v) => setDimensionPreset(v as DimensionPreset)}
              disabled={isLoading}
              className="flex flex-col gap-y-3"
            >
              <RadioItemWithIcon value="1024x1024" id="dim-1024x1024" label={t("flux.dim.square")} Icon={Square} />
              <RadioItemWithIcon value="1536x1024" id="dim-1536x1024" label={t("flux.dim.landscape")} Icon={RectangleHorizontal} />
              <RadioItemWithIcon value="1024x1536" id="dim-1024x1536" label={t("flux.dim.portrait")} Icon={RectangleVertical} />
              <RadioItemWithIcon value="768x768" id="dim-768x768" label={t("flux.dim.small")} Icon={Sparkles} />
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 p-4">
          <Button type="submit" disabled={isLoading || !prompt} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t("common.generating") : t("common.generate")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
