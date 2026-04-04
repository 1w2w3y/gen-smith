import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfig: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getApiKey: vi.fn(),
}));

describe("POST /api/audio/tts/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when modelId is missing", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "hello" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when input is missing", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-4o-mini-tts" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 404 when model is not in config", async () => {
    const { getModelConfig } = await import("@/lib/config");
    vi.mocked(getModelConfig).mockReturnValue(null);

    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "nonexistent", input: "hello" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("not_found");
  });

  it("constructs correct TTS URL and returns base64 audio", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-4o-mini-tts",
        displayName: "GPT-4o Mini TTS",
        endpoint: "https://test.cognitiveservices.azure.com",
        deploymentName: "gpt-4o-mini-tts",
        apiVersion: "2025-03-01-preview",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getApiKey: vi.fn().mockResolvedValue("mock-token"),
    }));

    // Mock fetch to return audio binary
    const audioBytes = new Uint8Array([0x49, 0x44, 0x33]); // fake audio
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(audioBytes.buffer),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-4o-mini-tts",
        input: "Hello world",
        voice: "nova",
        responseFormat: "mp3",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audio).toBeTruthy();
    expect(data.format).toBe("mp3");

    // Verify URL construction
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );

    // Verify request body
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.input).toBe("Hello world");
    expect(fetchBody.voice).toBe("nova");
    expect(fetchBody.response_format).toBe("mp3");

    vi.unstubAllGlobals();
  });
});
