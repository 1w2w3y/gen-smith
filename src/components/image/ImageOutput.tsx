"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Loader2, Download, Grid, ImageIcon } from "lucide-react";
import * as React from "react";

interface ImageInfo {
  b64_json: string;
  index: number;
  format: string;
}

interface ImageOutputProps {
  images: ImageInfo[] | null;
  isLoading: boolean;
}

function getMimeType(format: string): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function getGridColsClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

export function ImageOutput({ images, isLoading }: ImageOutputProps) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = React.useState<"grid" | number>("grid");

  React.useEffect(() => {
    if (images && images.length > 0) {
      setViewMode(images.length > 1 ? "grid" : 0);
    }
  }, [images]);

  const handleDownload = (img: ImageInfo) => {
    const byteCharacters = atob(img.b64_json);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: getMimeType(img.format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-${Date.now()}-${img.index}.${img.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showCarousel = images && images.length > 1;
  const isSingleView = typeof viewMode === "number";

  return (
    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-between gap-4 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
      {/* Image display area */}
      <div className="relative flex h-full w-full flex-grow items-center justify-center overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-2 h-8 w-8 animate-spin" />
            <p>{t("imageOutput.loading")}</p>
          </div>
        ) : images && images.length > 0 ? (
          viewMode === "grid" ? (
            <div
              className={`grid ${getGridColsClass(images.length)} max-h-full w-full max-w-full gap-2 p-1`}
            >
              {images.map((img) => (
                <div
                  key={img.index}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded border"
                  onClick={() => setViewMode(img.index)}
                >
                  <img
                    src={`data:${getMimeType(img.format)};base64,${img.b64_json}`}
                    alt={`Generated image ${img.index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : images[viewMode] ? (
            <img
              src={`data:${getMimeType(images[viewMode].format)};base64,${images[viewMode].b64_json}`}
              alt="Generated image"
              className="max-h-full max-w-full object-contain"
            />
          ) : null
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="mb-3 rounded-full bg-muted p-4">
              <ImageIcon className="h-8 w-8 opacity-40" />
            </div>
            <p>{t("imageOutput.empty")}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex h-10 w-full shrink-0 items-center justify-center gap-4">
        {showCarousel && (
          <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded p-1",
                viewMode === "grid" && "bg-accent"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            {images!.map((img) => (
              <Button
                key={img.index}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 overflow-hidden rounded p-0.5",
                  viewMode === img.index
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : "opacity-60 hover:opacity-100"
                )}
                onClick={() => setViewMode(img.index)}
              >
                <img
                  src={`data:${getMimeType(img.format)};base64,${img.b64_json}`}
                  alt={`Thumbnail ${img.index + 1}`}
                  className="h-full w-full object-cover"
                />
              </Button>
            ))}
          </div>
        )}

        {images && images.length > 0 && !isLoading && isSingleView && images[viewMode] && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(images[viewMode])}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("common.download")}
          </Button>
        )}
      </div>
    </div>
  );
}
