"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Download, Volume2 } from "lucide-react";
import * as React from "react";

interface AudioOutputProps {
  audioUrl: string | null;
  format: string | null;
  isLoading: boolean;
}

export function AudioOutput({ audioUrl, format, isLoading }: AudioOutputProps) {
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
    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border bg-card p-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="mb-2 h-8 w-8 animate-spin" />
          <p>Generating speech...</p>
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
            Download {format?.toUpperCase()}
          </Button>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          <Volume2 className="mx-auto mb-2 h-12 w-12 opacity-30" />
          <p>Generated audio will appear here</p>
        </div>
      )}
    </div>
  );
}
