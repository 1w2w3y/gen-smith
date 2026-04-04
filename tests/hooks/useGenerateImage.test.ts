import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateImage } from "@/hooks/useGenerateImage";

describe("useGenerateImage", () => {
  const defaultParams = {
    modelId: "gpt-image-1-mini",
    prompt: "A red fox",
    n: 1,
    size: "1024x1024",
    quality: "medium",
    outputFormat: "png",
    background: "auto" as const,
    moderation: "auto" as const,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useGenerateImage());

    expect(result.current.images).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.generate).toBe("function");
  });

  it("sets loading state during generation", async () => {
    let resolvePromise: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise as Promise<Response>);

    const { result } = renderHook(() => useGenerateImage());

    let generatePromise: Promise<void>;
    act(() => {
      generatePromise = result.current.generate(defaultParams);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.images).toBeNull();

    await act(async () => {
      resolvePromise!(
        new Response(
          JSON.stringify({
            images: [{ b64_json: "dGVzdA==", index: 0 }],
          }),
          { status: 200 }
        )
      );
      await generatePromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("sets images on successful generation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          images: [
            { b64_json: "aW1hZ2Ux", index: 0 },
            { b64_json: "aW1hZ2Uy", index: 1 },
          ],
        }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toHaveLength(2);
    expect(result.current.images![0].b64_json).toBe("aW1hZ2Ux");
    expect(result.current.images![0].format).toBe("png");
    expect(result.current.images![1].index).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error on API failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "internal_error", message: "Something went wrong" },
        }),
        { status: 500 }
      )
    );

    const { result } = renderHook(() => useGenerateImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toBeNull();
    expect(result.current.error).toBe("Something went wrong");
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error when no images returned", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ images: [] }), { status: 200 })
    );

    const { result } = renderHook(() => useGenerateImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toBeNull();
    expect(result.current.error).toBe("No images returned from API");
  });

  it("sets error on network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGenerateImage());

    await act(async () => {
      await result.current.generate(defaultParams);
    });

    expect(result.current.images).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("sends correct request to API", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ images: [{ b64_json: "dGVzdA==", index: 0 }] }),
        { status: 200 }
      )
    );

    const { result } = renderHook(() => useGenerateImage());

    await act(async () => {
      await result.current.generate({
        ...defaultParams,
        outputCompression: 80,
      });
    });

    expect(fetch).toHaveBeenCalledWith("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...defaultParams,
        outputCompression: 80,
      }),
    });
  });
});
