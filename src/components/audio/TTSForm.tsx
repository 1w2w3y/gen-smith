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
import type { TTSVoice, TTSFormat } from "@/types/tts";
import { Loader2 } from "lucide-react";
import * as React from "react";

export interface TTSFormData {
  modelId: string;
  input: string;
  voice: TTSVoice;
  speed?: number;
  responseFormat: TTSFormat;
  instructions?: string;
}

interface ModelOption {
  id: string;
  displayName: string;
}

interface TTSFormProps {
  models: ModelOption[];
  onSubmit: (data: TTSFormData) => void;
  isLoading: boolean;
  defaultValues?: Partial<TTSFormData>;
}

const VOICES: { value: TTSVoice; label: string }[] = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

export function TTSForm({ models, onSubmit, isLoading, defaultValues }: TTSFormProps) {
  const { t } = useLanguage();
  const [modelId, setModelId] = React.useState(defaultValues?.modelId ?? models[0]?.id ?? "");
  const [input, setInput] = React.useState(defaultValues?.input ?? "");
  const [voice, setVoice] = React.useState<TTSVoice>(defaultValues?.voice ?? "alloy");
  const [speed, setSpeed] = React.useState([defaultValues?.speed ?? 1.0]);
  const [responseFormat, setResponseFormat] =
    React.useState<TTSFormat>(defaultValues?.responseFormat ?? "mp3");
  const [instructions, setInstructions] = React.useState(defaultValues?.instructions ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data: TTSFormData = {
      modelId,
      input,
      voice,
      responseFormat,
    };
    if (speed[0] !== 1.0) data.speed = speed[0];
    if (instructions.trim()) data.instructions = instructions.trim();
    onSubmit(data);
  };

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-lg">{t("tts.title")}</CardTitle>
        <CardDescription>{t("tts.desc")}</CardDescription>
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
            <Label htmlFor="tts-input">{t("tts.text")}</Label>
            <Textarea
              id="tts-input"
              placeholder={t("tts.textPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label>{t("tts.voice")}</Label>
            <RadioGroup
              value={voice}
              onValueChange={(v) => setVoice(v as TTSVoice)}
              disabled={isLoading}
              className="grid grid-cols-3 gap-3"
            >
              {VOICES.map((v) => (
                <div key={v.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={v.value} id={`voice-${v.value}`} />
                  <Label htmlFor={`voice-${v.value}`} className="cursor-pointer">
                    {v.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{t("tts.speed")}: {speed[0].toFixed(1)}x</Label>
            <Slider
              min={0.25}
              max={4.0}
              step={0.25}
              value={speed}
              onValueChange={setSpeed}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>{t("tts.format")}</Label>
            <RadioGroup
              value={responseFormat}
              onValueChange={(v) => setResponseFormat(v as TTSFormat)}
              disabled={isLoading}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              {(["mp3", "opus", "aac", "flac", "wav"] as TTSFormat[]).map(
                (fmt) => (
                  <div key={fmt} className="flex items-center space-x-2">
                    <RadioGroupItem value={fmt} id={`fmt-${fmt}`} />
                    <Label htmlFor={`fmt-${fmt}`} className="cursor-pointer uppercase">
                      {fmt}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tts-instructions">{t("tts.instructions")}</Label>
            <Textarea
              id="tts-instructions"
              placeholder={t("tts.instructionsPlaceholder")}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isLoading}
              className="min-h-[60px]"
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 p-4">
          <Button type="submit" disabled={isLoading || !input} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t("common.generating") : t("tts.generateSpeech")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
