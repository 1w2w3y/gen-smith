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

const DIMENSION_PRESETS: Record<DimensionPreset, { width: number; height: number; label: string; Icon: React.ElementType }> = {
  "1024x1024": { width: 1024, height: 1024, label: "1024x1024 (Square)", Icon: Square },
  "1536x1024": { width: 1536, height: 1024, label: "1536x1024 (Landscape)", Icon: RectangleHorizontal },
  "1024x1536": { width: 1024, height: 1536, label: "1024x1536 (Portrait)", Icon: RectangleVertical },
  "768x768": { width: 768, height: 768, label: "768x768 (Small)", Icon: Sparkles },
};

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

export function FluxGenerationForm({
  models,
  onSubmit,
  isLoading,
}: FluxGenerationFormProps) {
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
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg">FLUX Image Generation</CardTitle>
        <CardDescription>
          Configure parameters and generate images with FLUX models
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-1 flex-col overflow-hidden"
      >
        <CardContent className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Model selector */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={modelId}
              onValueChange={setModelId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
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
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-[80px]"
            />
          </div>

          {/* Number of images */}
          <div className="space-y-2">
            <Label>Number of images: {n[0]}</Label>
            <Slider
              min={1}
              max={4}
              step={1}
              value={n}
              onValueChange={setN}
              disabled={isLoading}
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-3">
            <Label>Dimensions</Label>
            <RadioGroup
              value={dimensionPreset}
              onValueChange={(v) => setDimensionPreset(v as DimensionPreset)}
              disabled={isLoading}
              className="flex flex-col gap-y-3"
            >
              {Object.entries(DIMENSION_PRESETS).map(
                ([key, { label, Icon }]) => (
                  <RadioItemWithIcon
                    key={key}
                    value={key}
                    id={`dim-${key}`}
                    label={label}
                    Icon={Icon}
                  />
                )
              )}
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
            {isLoading ? "Generating..." : "Generate"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
