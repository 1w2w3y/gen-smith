import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfigForFamily: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthHeaders: vi.fn(),
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

  it("returns 400 when modelId is an empty or whitespace string", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "  ", input: "hello" }),
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
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue(null);

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
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "gpt-4o-mini-tts",
        displayName: "GPT-4o Mini TTS",
        endpoint: "https://test.cognitiveservices.azure.com",
        deploymentName: "gpt-4o-mini-tts",
        apiVersion: "2025-03-01-preview",
        auth: { type: "apiKey", apiKey: "test-api-key" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({
        "api-key": "test-api-key",
      }),
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
        voice: "coral",
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
          "api-key": "test-api-key",
        }),
      })
    );

    // Verify request body
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.input).toBe("Hello world");
    expect(fetchBody.voice).toBe("coral");
    expect(fetchBody.response_format).toBe("mp3");

    vi.unstubAllGlobals();
  });

  it("accepts every documented voice from the shared TTS_VOICES list", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "gpt-4o-mini-tts",
        displayName: "GPT-4o Mini TTS",
        endpoint: "https://test.cognitiveservices.azure.com",
        deploymentName: "gpt-4o-mini-tts",
        apiVersion: "2025-03-01-preview",
        auth: { type: "apiKey", apiKey: "test-api-key" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({
        "api-key": "test-api-key",
      }),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([0x49, 0x44, 0x33]).buffer),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/audio/tts/generate/route");
    const { TTS_VOICES } = await import("@/types/tts");

    // Pin the roster explicitly so this test fails if a voice is silently
    // dropped from the shared list (the loop below would pass either way).
    expect([...TTS_VOICES]).toEqual([
      "alloy",
      "ash",
      "ballad",
      "cedar",
      "coral",
      "echo",
      "fable",
      "marin",
      "nova",
      "onyx",
      "sage",
      "shimmer",
      "verse",
    ]);

    for (const voice of TTS_VOICES) {
      const request = new Request("http://localhost/api/audio/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "gpt-4o-mini-tts",
          input: "Hello world",
          voice,
        }),
      });

      const response = await POST(request as never);
      expect(response.status, `voice ${voice}`).toBe(200);

      const fetchBody = JSON.parse(
        mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body
      );
      expect(fetchBody.voice, `voice ${voice}`).toBe(voice);
    }

    vi.unstubAllGlobals();
  });

  it("returns 400 for an unknown voice", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-4o-mini-tts",
        input: "Hello world",
        voice: "bogus",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when speed is a string", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-4o-mini-tts",
        input: "Hello world",
        speed: "1.5",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when speed is out of range", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-4o-mini-tts",
        input: "Hello world",
        speed: 10,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for an unknown responseFormat", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-4o-mini-tts",
        input: "Hello world",
        responseFormat: "ogg",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when the body is a null JSON value", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be a JSON object");
  });

  it("returns 400 when the body is a JSON array", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["hello"]),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be a JSON object");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/audio/tts/generate/route");

    const request = new Request("http://localhost/api/audio/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be valid JSON");
  });
});
