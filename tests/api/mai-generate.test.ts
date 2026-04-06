import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfig: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getApiKey: vi.fn(),
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
    const { getModelConfig } = await import("@/lib/config");
    vi.mocked(getModelConfig).mockReturnValue(null);

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

  it("uses api-key header for apiKey auth type", async () => {
    vi.resetModules();

    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
        auth: { type: "apiKey", apiKey: "test-api-key" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getApiKey: vi.fn().mockResolvedValue("test-api-key"),
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
      getModelConfig: vi.fn().mockReturnValue({
        id: "MAI-Image-2",
        displayName: "MAI Image 2",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "MAI-Image-2",
        apiVersion: "",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getApiKey: vi.fn().mockResolvedValue("mock-bearer-token"),
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
});
