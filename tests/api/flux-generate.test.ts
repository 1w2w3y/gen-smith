import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/config", () => ({
  getModelConfig: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getApiKey: vi.fn(),
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
    const { getModelConfig } = await import("@/lib/config");
    vi.mocked(getModelConfig).mockReturnValue(null);

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
      getModelConfig: vi.fn().mockReturnValue({
        id: "FLUX.2-pro",
        displayName: "FLUX.2 Pro",
        endpoint: "https://test.services.ai.azure.com",
        deploymentName: "flux-2-pro",
        apiVersion: "preview",
        auth: { type: "azureCli" },
      }),
    }));

    vi.doMock("@/lib/auth", () => ({
      getApiKey: vi.fn().mockResolvedValue("mock-token"),
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
});
