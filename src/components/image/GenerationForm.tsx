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
import type {
  ImageSize,
  ImageQuality,
  OutputFormat,
  Background,
  Moderation,
} from "@/types/image";
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Eraser,
  ShieldCheck,
  ShieldAlert,
  FileImage,
  Tally1,
  Tally2,
  Tally3,
  Loader2,
  BrickWall,
} from "lucide-react";
import * as React from "react";

export interface GenerationFormData {
  modelId: string;
  prompt: string;
  n: number;
  size: ImageSize;
  quality: ImageQuality;
  outputFormat: OutputFormat;
  outputCompression?: number;
  background: Background;
  moderation: Moderation;
}

interface ModelOption {
  id: string;
  displayName: string;
}

interface GenerationFormProps {
  models: ModelOption[];
  onSubmit: (data: GenerationFormData) => void;
  isLoading: boolean;
}

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

export function GenerationForm({
  models,
  onSubmit,
  isLoading,
}: GenerationFormProps) {
  const { t } = useLanguage();
  const [modelId, setModelId] = React.useState(models[0]?.id ?? "");
  const [prompt, setPrompt] = React.useState("");
  const [n, setN] = React.useState([1]);
  const [size, setSize] = React.useState<ImageSize>("1024x1024");
  const [quality, setQuality] = React.useState<ImageQuality>("medium");
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("png");
  const [compression, setCompression] = React.useState([100]);
  const [background, setBackground] = React.useState<Background>("auto");
  const [moderation, setModeration] = React.useState<Moderation>("auto");

  const showCompression = outputFormat === "jpeg" || outputFormat === "webp";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData: GenerationFormData = {
      modelId,
      prompt,
      n: n[0],
      size,
      quality,
      outputFormat,
      background,
      moderation,
    };
    if (showCompression) {
      formData.outputCompression = compression[0];
    }
    onSubmit(formData);
  };

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg">{t("gptImage.title")}</CardTitle>
        <CardDescription>{t("gptImage.desc")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-1 flex-col overflow-hidden"
      >
        <CardContent className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Model selector */}
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

          {/* Prompt */}
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

          {/* Number of images */}
          <div className="space-y-2">
            <Label>
              {t("common.numImages")}: {n[0]}
            </Label>
            <Slider
              min={1}
              max={4}
              step={1}
              value={n}
              onValueChange={setN}
              disabled={isLoading}
            />
          </div>

          {/* Size */}
          <div className="space-y-3">
            <Label>{t("gptImage.size")}</Label>
            <RadioGroup
              value={size}
              onValueChange={(v) => setSize(v as ImageSize)}
              disabled={isLoading}
              className="flex flex-col gap-y-3"
            >
              <RadioItemWithIcon value="auto" id="size-auto" label={t("gptImage.size.auto")} Icon={Sparkles} />
              <RadioItemWithIcon value="1024x1024" id="size-square" label={t("gptImage.size.square")} Icon={Square} />
              <RadioItemWithIcon value="1536x1024" id="size-landscape" label={t("gptImage.size.landscape")} Icon={RectangleHorizontal} />
              <RadioItemWithIcon value="1024x1536" id="size-portrait" label={t("gptImage.size.portrait")} Icon={RectangleVertical} />
            </RadioGroup>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <Label>{t("gptImage.quality")}</Label>
            <RadioGroup
              value={quality}
              onValueChange={(v) => setQuality(v as ImageQuality)}
              disabled={isLoading}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              <RadioItemWithIcon value="auto" id="quality-auto" label={t("gptImage.quality.auto")} Icon={Sparkles} />
              <RadioItemWithIcon value="low" id="quality-low" label={t("gptImage.quality.low")} Icon={Tally1} />
              <RadioItemWithIcon value="medium" id="quality-medium" label={t("gptImage.quality.medium")} Icon={Tally2} />
              <RadioItemWithIcon value="high" id="quality-high" label={t("gptImage.quality.high")} Icon={Tally3} />
            </RadioGroup>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <Label>{t("gptImage.background")}</Label>
            <RadioGroup
              value={background}
              onValueChange={(v) => setBackground(v as Background)}
              disabled={isLoading}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              <RadioItemWithIcon value="auto" id="bg-auto" label={t("gptImage.background.auto")} Icon={Sparkles} />
              <RadioItemWithIcon value="opaque" id="bg-opaque" label={t("gptImage.background.opaque")} Icon={BrickWall} />
              <RadioItemWithIcon value="transparent" id="bg-transparent" label={t("gptImage.background.transparent")} Icon={Eraser} />
            </RadioGroup>
          </div>

          {/* Output format */}
          <div className="space-y-3">
            <Label>{t("gptImage.outputFormat")}</Label>
            <RadioGroup
              value={outputFormat}
              onValueChange={(v) => setOutputFormat(v as OutputFormat)}
              disabled={isLoading}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              <RadioItemWithIcon value="png" id="format-png" label="PNG" Icon={FileImage} />
              <RadioItemWithIcon value="jpeg" id="format-jpeg" label="JPEG" Icon={FileImage} />
              <RadioItemWithIcon value="webp" id="format-webp" label="WebP" Icon={FileImage} />
            </RadioGroup>
          </div>

          {/* Compression */}
          {showCompression && (
            <div className="space-y-2">
              <Label>{t("gptImage.compression")}: {compression[0]}%</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={compression}
                onValueChange={setCompression}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Moderation */}
          <div className="space-y-3">
            <Label>{t("gptImage.moderation")}</Label>
            <RadioGroup
              value={moderation}
              onValueChange={(v) => setModeration(v as Moderation)}
              disabled={isLoading}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              <RadioItemWithIcon value="auto" id="mod-auto" label={t("gptImage.moderation.auto")} Icon={ShieldCheck} />
              <RadioItemWithIcon value="low" id="mod-low" label={t("gptImage.moderation.low")} Icon={ShieldAlert} />
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="border-t p-4">
          <Button
            type="submit"
            disabled={isLoading || !prompt}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t("common.generating") : t("common.generate")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
