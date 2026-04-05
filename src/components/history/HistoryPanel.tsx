"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Trash2, RotateCcw, ImageIcon, AudioLines } from "lucide-react";
import type { TranslationKey } from "@/i18n";
import type {
  HistoryEntry,
  GptImageHistoryEntry,
  FluxImageHistoryEntry,
  TTSHistoryEntry,
} from "@/types/history";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  isLoading: boolean;
  onRestore: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onViewImages?: (id: string) => void;
}

function timeAgo(ts: number, t: (key: TranslationKey) => string): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("history.ago.justNow");
  if (minutes < 60)
    return t("history.ago.minutes").replace("{n}", String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("history.ago.hours").replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  return t("history.ago.days").replace("{n}", String(days));
}

function isImageEntry(
  entry: HistoryEntry
): entry is GptImageHistoryEntry | FluxImageHistoryEntry {
  return entry.playground === "gpt-image" || entry.playground === "flux-image";
}

function ImageHistoryCard({
  entry,
  onRestore,
  onDelete,
  onViewImages,
  t,
}: {
  entry: GptImageHistoryEntry | FluxImageHistoryEntry;
  onRestore: () => void;
  onDelete: () => void;
  onViewImages?: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      {entry.thumbnails.length > 0 && (
        <button
          type="button"
          className="mb-2 flex w-full cursor-pointer gap-1.5"
          onClick={onViewImages}
          title={t("history.viewImages")}
        >
          {entry.thumbnails.map((thumb, i) => (
            <img
              key={i}
              src={`data:image/jpeg;base64,${thumb}`}
              alt=""
              className="h-16 w-16 rounded object-cover"
            />
          ))}
        </button>
      )}
      {entry.thumbnails.length === 0 && (
        <div className="mb-2 flex h-16 items-center gap-1.5 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="text-xs">
            {entry.imageCount} {t("history.images")}
          </span>
        </div>
      )}
      <p className="mb-1 line-clamp-2 text-sm" title={entry.params.prompt}>
        {entry.params.prompt}
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        {timeAgo(entry.createdAt, t)}
      </p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onRestore}>
          <RotateCcw className="mr-1 h-3 w-3" />
          {t("history.restore")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TTSHistoryCard({
  entry,
  onRestore,
  onDelete,
  t,
}: {
  entry: TTSHistoryEntry;
  onRestore: () => void;
  onDelete: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <AudioLines className="h-4 w-4" />
        <span className="text-xs">
          {entry.params.voice} &middot; {entry.params.responseFormat}
        </span>
      </div>
      <p className="mb-1 line-clamp-2 text-sm" title={entry.params.input}>
        {entry.params.input}
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        {timeAgo(entry.createdAt, t)}
      </p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onRestore}>
          <RotateCcw className="mr-1 h-3 w-3" />
          {t("history.restore")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function HistoryPanel({
  entries,
  isLoading,
  onRestore,
  onDelete,
  onClearAll,
  onViewImages,
}: HistoryPanelProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("common.loading")}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("history.empty")}</p>
      </div>
    );
  }

  const handleClearAll = () => {
    if (window.confirm(t("history.clearConfirm"))) {
      onClearAll();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleClearAll}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          {t("history.clearAll")}
        </Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {entries.map((entry) =>
          isImageEntry(entry) ? (
            <ImageHistoryCard
              key={entry.id}
              entry={entry}
              onRestore={() => onRestore(entry)}
              onDelete={() => onDelete(entry.id)}
              onViewImages={onViewImages ? () => onViewImages(entry.id) : undefined}
              t={t}
            />
          ) : (
            <TTSHistoryCard
              key={entry.id}
              entry={entry as TTSHistoryEntry}
              onRestore={() => onRestore(entry)}
              onDelete={() => onDelete(entry.id)}
              t={t}
            />
          )
        )}
      </div>
    </div>
  );
}
