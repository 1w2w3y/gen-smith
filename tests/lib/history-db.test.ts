import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllEntries,
  addEntry,
  deleteEntry,
  clearEntries,
  saveImages,
  getImages,
  _resetDB,
} from "@/lib/history-db";
import type { GptImageHistoryEntry, TTSHistoryEntry } from "@/types/history";

function makeImageEntry(overrides?: Partial<GptImageHistoryEntry>): GptImageHistoryEntry {
  return {
    id: crypto.randomUUID(),
    playground: "gpt-image",
    createdAt: Date.now(),
    params: {
      modelId: "gpt-image-1",
      prompt: "test prompt",
      n: 1,
      size: "1024x1024",
      quality: "medium",
      outputFormat: "png",
      background: "auto",
      moderation: "auto",
    },
    thumbnails: [],
    imageCount: 1,
    ...overrides,
  };
}

function makeTTSEntry(overrides?: Partial<TTSHistoryEntry>): TTSHistoryEntry {
  return {
    id: crypto.randomUUID(),
    playground: "tts",
    createdAt: Date.now(),
    params: {
      modelId: "gpt-4o-mini-tts",
      input: "Hello world",
      voice: "alloy",
      responseFormat: "mp3",
    },
    ...overrides,
  };
}

beforeEach(() => {
  // Reset DB between tests to get a fresh database
  _resetDB();
  // Clear all IndexedDB databases
  indexedDB = new IDBFactory();
});

describe("history-db", () => {
  it("adds and retrieves entries", async () => {
    const entry = makeImageEntry();
    await addEntry(entry);

    const entries = await getAllEntries("gpt-image");
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(entry.id);
  });

  it("returns entries sorted by createdAt descending", async () => {
    const old = makeImageEntry({ createdAt: 1000 });
    const recent = makeImageEntry({ createdAt: 2000 });
    await addEntry(old);
    await addEntry(recent);

    const entries = await getAllEntries("gpt-image");
    expect(entries[0].createdAt).toBe(2000);
    expect(entries[1].createdAt).toBe(1000);
  });

  it("filters entries by playground type", async () => {
    await addEntry(makeImageEntry());
    await addEntry(makeTTSEntry());

    const imageEntries = await getAllEntries("gpt-image");
    const ttsEntries = await getAllEntries("tts");

    expect(imageEntries).toHaveLength(1);
    expect(ttsEntries).toHaveLength(1);
    expect(imageEntries[0].playground).toBe("gpt-image");
    expect(ttsEntries[0].playground).toBe("tts");
  });

  it("deletes an entry and its images", async () => {
    const entry = makeImageEntry();
    await addEntry(entry);
    await saveImages(entry.id, [
      { b64_json: "abc", index: 0, format: "png" },
    ]);

    await deleteEntry(entry.id);

    const entries = await getAllEntries("gpt-image");
    const images = await getImages(entry.id);
    expect(entries).toHaveLength(0);
    expect(images).toHaveLength(0);
  });

  it("clears all entries for a playground type", async () => {
    await addEntry(makeImageEntry());
    await addEntry(makeImageEntry());
    await addEntry(makeTTSEntry());

    await clearEntries("gpt-image");

    const imageEntries = await getAllEntries("gpt-image");
    const ttsEntries = await getAllEntries("tts");
    expect(imageEntries).toHaveLength(0);
    expect(ttsEntries).toHaveLength(1);
  });

  it("saves and retrieves full images", async () => {
    const entry = makeImageEntry();
    await addEntry(entry);

    const images = [
      { b64_json: "image1base64", index: 0, format: "png" },
      { b64_json: "image2base64", index: 1, format: "png" },
    ];
    await saveImages(entry.id, images);

    const retrieved = await getImages(entry.id);
    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].b64_json).toBe("image1base64");
    expect(retrieved[1].b64_json).toBe("image2base64");
    expect(retrieved[0].index).toBe(0);
    expect(retrieved[1].index).toBe(1);
  });

  it("prunes oldest entries when exceeding cap", async () => {
    // Add 50 entries
    for (let i = 0; i < 50; i++) {
      await addEntry(makeImageEntry({ createdAt: i }));
    }

    // Adding one more should prune the oldest
    const newest = makeImageEntry({ createdAt: 100 });
    await addEntry(newest);

    const entries = await getAllEntries("gpt-image");
    expect(entries.length).toBeLessThanOrEqual(50);
    // Newest should be present
    expect(entries.some((e) => e.id === newest.id)).toBe(true);
  });
});
