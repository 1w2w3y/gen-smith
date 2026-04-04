"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Loader2, Download, Volume2 } from "lucide-react";
import * as React from "react";

interface AudioOutputProps {
  audioUrl: string | null;
  format: string | null;
  isLoading: boolean;
}

export function AudioOutput({ audioUrl, format, isLoading }: AudioOutputProps) {
  const { t } = useLanguage();
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleDownload = () => {
    if (!audioUrl || !format) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `speech-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="mb-2 h-8 w-8 animate-spin" />
          <p>{t("audioOutput.loading")}</p>
        </div>
      ) : audioUrl ? (
        <>
          <Volume2 className="h-16 w-16 text-muted-foreground" />
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            autoPlay
            className="w-full max-w-md"
          />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            {t("common.download")} {format?.toUpperCase()}
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center text-center text-muted-foreground">
          <div className="mb-3 rounded-full bg-muted p-4">
            <Volume2 className="h-8 w-8 opacity-40" />
          </div>
          <p>{t("audioOutput.empty")}</p>
        </div>
      )}
    </div>
  );
}
