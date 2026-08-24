import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfigForFamily: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthHeaders: vi.fn(),
}));

describe("POST /api/image/mai/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when modelId is missing", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when modelId is an empty or whitespace string", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "  ", prompt: "test" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when prompt is missing", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "MAI-Image-2" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 404 when model is not in config", async () => {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue(null);

    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "nonexistent", prompt: "test" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("not_found");
  });

  it("returns 400 when width or height is not a positive integer", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "MAI-Image-2",
        prompt: "test",
        width: 0,
        height: 1024,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("uses api-key header for apiKey auth type", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
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
      json: () =>
        Promise.resolve({
          data: [{ b64_json: "base64maidata" }],
          usage: null,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "MAI-Image-2",
        prompt: "A mountain lake",
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.images).toHaveLength(1);
    expect(data.images[0].b64_json).toBe("base64maidata");

    // Verify URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.services.ai.azure.com/mai/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "api-key": "test-api-key",
        }),
      })
    );

    // Verify NO Authorization header for apiKey auth
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty("Authorization");

    // Verify request body uses deploymentName as model
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.model).toBe("MAI-Image-2");
    expect(fetchBody.prompt).toBe("A mountain lake");
    expect(fetchBody.width).toBe(1024);
    expect(fetchBody.height).toBe(1024);

    vi.unstubAllGlobals();
  });

  it("uses Authorization Bearer for azureCli auth type", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({
        Authorization: "Bearer mock-bearer-token",
      }),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ b64_json: "base64maidata" }],
          usage: null,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "MAI-Image-2",
        prompt: "A sunset",
        width: 768,
        height: 768,
      }),
    });

    await POST(request as never);

    // Verify Authorization Bearer header
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.services.ai.azure.com/mai/v1/images/generations",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-bearer-token",
        }),
      })
    );

    // Verify NO api-key header for azureCli auth
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty("api-key");

    vi.unstubAllGlobals();
  });

  it("returns 400 when height is not a positive integer", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "MAI-Image-2",
        prompt: "A mountain lake",
        width: 1024,
        height: 0,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when width or height exceeds the 4096 bound", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    for (const dims of [
      { width: 4097, height: 1024 },
      { width: 1024, height: 4097 },
    ]) {
      const request = new Request("http://localhost/api/image/mai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "MAI-Image-2",
          prompt: "A mountain lake",
          ...dims,
        }),
      });

      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status, JSON.stringify(dims)).toBe(400);
      expect(data.error.code, JSON.stringify(dims)).toBe("bad_request");
    }
  });

  it("returns 400 when the body is a null JSON value", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
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
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["MAI-Image-2"]),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be a JSON object");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
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
  it("does not record a generation event when the API returns no images", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({ "api-key": "test-key" }),
    }));

    const trackGeneration = vi.fn();
    vi.doMock("@/lib/telemetry", () => ({
      trackGeneration,
      trackException: vi.fn(),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], usage: null }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "MAI-Image-2", prompt: "A red fox", width: 1024, height: 1024 }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("empty_response");
    // An empty result is a failure — it must not be counted as a generation.
    expect(trackGeneration).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("records the number of images actually returned", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({ "api-key": "test-key" }),
    }));

    const trackGeneration = vi.fn();
    vi.doMock("@/lib/telemetry", () => ({
      trackGeneration,
      trackException: vi.fn(),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ b64_json: "one" }, { b64_json: "two" }],
          usage: null,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/image/mai/generate/route");

    const request = new Request("http://localhost/api/image/mai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "MAI-Image-2", prompt: "A red fox", width: 1024, height: 1024 }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);

    expect(trackGeneration).toHaveBeenCalledTimes(1);
    const [eventName, properties, metrics] = trackGeneration.mock.calls[0];
    expect(eventName).toBe("MaiImageGeneration");
    expect(properties.imageCount).toBe("2");
    expect(metrics.imageCount).toBe(2);

    vi.unstubAllGlobals();
  });
});
