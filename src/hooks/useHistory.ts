import { useState, useEffect, useCallback } from "react";
import type {
  PlaygroundType,
  HistoryEntry,
  HistoryImageRecord,
} from "@/types/history";
import {
  getAllEntries,
  addEntry,
  deleteEntry as dbDeleteEntry,
  clearEntries,
  saveImages,
  getImages,
} from "@/lib/history-db";
import { generateThumbnails } from "@/lib/thumbnail";

export function useHistory(playground: PlaygroundType) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllEntries(playground)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch(() => {
        // IndexedDB unavailable — degrade gracefully
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playground]);

  const addImageEntry = useCallback(
    async (
      params: object,
      images: { b64_json: string; index: number; format: string }[]
    ) => {
      const id = crypto.randomUUID();
      let thumbnails: string[] = [];
      try {
        thumbnails = await generateThumbnails(
          images.map((img) => ({ b64_json: img.b64_json, format: img.format }))
        );
      } catch {
        // If thumbnail generation fails, store empty array
      }

      const entry = {
        id,
        playground,
        createdAt: Date.now(),
        params,
        thumbnails,
        imageCount: images.length,
      } as HistoryEntry;

      await addEntry(entry);
      await saveImages(id, images);
      setEntries((prev) => [entry, ...prev].slice(0, 50));
    },
    [playground]
  );

  const addTTSEntry = useCallback(
    async (params: object) => {
      const entry = {
        id: crypto.randomUUID(),
        playground: "tts" as const,
        createdAt: Date.now(),
        params,
      } as HistoryEntry;

      await addEntry(entry);
      setEntries((prev) => [entry, ...prev].slice(0, 50));
    },
    []
  );

  const removeEntry = useCallback(async (id: string) => {
    await dbDeleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await clearEntries(playground);
    setEntries([]);
  }, [playground]);

  const getFullImages = useCallback(
    async (historyId: string): Promise<HistoryImageRecord[]> => {
      return getImages(historyId);
    },
    []
  );

  return {
    entries,
    isLoading,
    addImageEntry,
    addTTSEntry,
    removeEntry,
    clearAll,
    getFullImages,
  };
}
