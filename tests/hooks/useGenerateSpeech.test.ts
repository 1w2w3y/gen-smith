import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateSpeech } from "@/hooks/useGenerateSpeech";

describe("useGenerateSpeech", () => {
  const defaultParams = {
    modelId: "gpt-4o-mini-tts",
    input: "Hello world",
    voice: "alloy",
    responseFormat: "mp3",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("atob", (s: string) =>
      Buffer.from(s, "base64").toString("binary")
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useGenerateSpeech());

    expect(result.current.audioUrl).toBeNull();
    expect(result.current.format).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets audioUrl on successful generation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ audio: "SGVsbG8=", format: "mp3" }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateSpeech());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.audioUrl).toBe("blob:mock-url");
    expect(result.current.format).toBe("mp3");
    expect(result.current.error).toBeNull();
  });

  it("calls /api/audio/tts/generate endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ audio: "SGVsbG8=", format: "mp3" }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateSpeech());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/audio/tts/generate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sets error on API failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "api_error", message: "TTS failed" },
        }),
        { status: 500 }
      )
    );

    const { result } = renderHook(() => useGenerateSpeech());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.audioUrl).toBeNull();
    expect(result.current.error).toBe("TTS failed");
  });
});
