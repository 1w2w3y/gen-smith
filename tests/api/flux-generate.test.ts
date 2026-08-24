import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfigForFamily: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthHeaders: vi.fn(),
}));

describe("POST /api/image/flux/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when modelId is missing", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
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
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
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
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "FLUX.2-pro" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 404 when model is not in config", async () => {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue(null);

    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "nonexistent", prompt: "test" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("not_found");
  });

  it("constructs correct FLUX API URL and returns images", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "FLUX.2-pro",
        displayName: "FLUX.2 Pro",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "flux-2-pro",
        apiVersion: "preview",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({
        Authorization: "Bearer mock-token",
      }),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ b64_json: "base64fluxdata" }],
          usage: null,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "FLUX.2-pro",
        prompt: "A red fox",
        width: 1024,
        height: 1024,
        n: 1,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.images).toHaveLength(1);
    expect(data.images[0].b64_json).toBe("base64fluxdata");

    // Verify URL construction with deployment slug
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );

    // Verify request body uses width/height
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.prompt).toBe("A red fox");
    expect(fetchBody.width).toBe(1024);
    expect(fetchBody.height).toBe(1024);
    expect(fetchBody.model).toBe("FLUX.2-pro");

    vi.unstubAllGlobals();
  });

  it("returns 400 when width or height is not a positive integer", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "FLUX.2-pro",
        prompt: "A red fox",
        width: -5,
        height: 1024,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when width is a string", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "FLUX.2-pro",
        prompt: "A red fox",
        width: "1024",
        height: 1024,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when height is not a positive integer", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "FLUX.2-pro",
        prompt: "A red fox",
        width: 1024,
        height: -5,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when width or height exceeds the 4096 bound", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    for (const dims of [
      { width: 4097, height: 1024 },
      { width: 1024, height: 4097 },
    ]) {
      const request = new Request("http://localhost/api/image/flux/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "FLUX.2-pro",
          prompt: "A red fox",
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
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
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
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["FLUX.2-pro"]),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be a JSON object");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
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
        id: "FLUX.2-pro",
        displayName: "FLUX.2 Pro",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "flux-2-pro",
        apiVersion: "preview",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer mock-token" }),
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

    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "FLUX.2-pro", prompt: "A red fox", width: 1024, height: 1024 }),
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
        id: "FLUX.2-pro",
        displayName: "FLUX.2 Pro",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "flux-2-pro",
        apiVersion: "preview",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer mock-token" }),
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

    const { POST } = await import("@/app/api/image/flux/generate/route");

    const request = new Request("http://localhost/api/image/flux/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "FLUX.2-pro", prompt: "A red fox", width: 1024, height: 1024 }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);

    expect(trackGeneration).toHaveBeenCalledTimes(1);
    const [eventName, properties, metrics] = trackGeneration.mock.calls[0];
    expect(eventName).toBe("FluxImageGeneration");
    expect(properties.imageCount).toBe("2");
    expect(metrics.imageCount).toBe(2);

    vi.unstubAllGlobals();
  });
});
