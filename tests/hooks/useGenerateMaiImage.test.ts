import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateMaiImage } from "@/hooks/useGenerateMaiImage";

describe("useGenerateMaiImage", () => {
  const defaultParams = {
    modelId: "MAI-Image-2",
    prompt: "A mountain lake at sunrise",
    width: 1024,
    height: 1024,
    n: 1,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useGenerateMaiImage());

    expect(result.current.images).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.generate).toBe("function");
  });

  it("sets images on successful generation with format png", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          images: [{ b64_json: "maiimage", index: 0 }],
        }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateMaiImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toHaveLength(1);
    expect(result.current.images![0].b64_json).toBe("maiimage");
    expect(result.current.images![0].format).toBe("png");
    expect(result.current.error).toBeNull();
  });

  it("calls /api/image/mai/generate endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ images: [{ b64_json: "data", index: 0 }] }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateMaiImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/image/mai/generate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sets error on API failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "api_error", message: "MAI Image API failed" },
        }),
        { status: 500 }
      )
    );

    const { result } = renderHook(() => useGenerateMaiImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toBeNull();
    expect(result.current.error).toBe("MAI Image API failed");
  });

  it("sets error on network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGenerateMaiImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toBeNull();
    expect(result.current.error).toBe("Network error");
  });
});
