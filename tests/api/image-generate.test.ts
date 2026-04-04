import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the config module
vi.mock("@/lib/config", () => ({
  getModelConfig: vi.fn(),
}));

describe("POST /api/image/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when modelId is missing", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
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
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 404 when model is not in config", async () => {
    const { getModelConfig } = await import("@/lib/config");
    vi.mocked(getModelConfig).mockReturnValue(null);

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "nonexistent",
        prompt: "test prompt",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("not_found");
  });

  it("uses AzureCliCredential for azureCli auth type", async () => {
    vi.resetModules();

    const mockGetToken = vi.fn().mockResolvedValue({
      token: "mock-azure-cli-token",
      expiresOnTimestamp: Date.now() + 3600000,
    });

    vi.doMock("@azure/identity", () => ({
      AzureCliCredential: vi.fn().mockImplementation(() => ({
        getToken: mockGetToken,
      })),
      ManagedIdentityCredential: vi.fn(),
    }));

    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "azureCli" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen },
      })),
    }));

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test prompt",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);

    expect(mockGetToken).toHaveBeenCalledWith(
      "https://cognitiveservices.azure.com/.default"
    );
  });

  it("calls OpenAI with correct parameters and returns images", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-image-1-mini",
        displayName: "GPT Image 1 Mini",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1-mini",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [
        { b64_json: "base64imagedata1" },
        { b64_json: "base64imagedata2" },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen },
      })),
    }));

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1-mini",
        prompt: "A red fox in autumn forest",
        n: 2,
        size: "1024x1024",
        quality: "medium",
        outputFormat: "png",
        background: "auto",
        moderation: "auto",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.images).toHaveLength(2);
    expect(data.images[0].b64_json).toBe("base64imagedata1");
    expect(data.images[0].index).toBe(0);
    expect(data.images[1].b64_json).toBe("base64imagedata2");
    expect(data.images[1].index).toBe(1);
  });

  it("uses deploymentName (not modelId) as the model parameter to Azure", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "my-custom-id",
        displayName: "Custom Model",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1-mini",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen },
      })),
    }));

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "my-custom-id",
        prompt: "test",
      }),
    });

    await POST(request as never);

    expect(mockGen).toHaveBeenCalledTimes(1);
    const callParams = mockGen.mock.calls[0][0];
    expect(callParams.model).toBe("gpt-image-1-mini");
  });

  it("includes output_compression only for jpeg/webp formats", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen },
      })),
    }));

    const { POST } = await import("@/app/api/image/generate/route");

    // PNG with compression should NOT include output_compression
    const request1 = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        outputFormat: "png",
        outputCompression: 80,
      }),
    });

    await POST(request1 as never);
    expect(mockGen.mock.calls[0][0].output_compression).toBeUndefined();

    // JPEG with compression SHOULD include output_compression
    mockGen.mockClear();
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen2 = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen2 },
      })),
    }));

    const { POST: POST2 } = await import("@/app/api/image/generate/route");

    const request2 = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        outputFormat: "jpeg",
        outputCompression: 80,
      }),
    });

    await POST2(request2 as never);
    expect(mockGen2.mock.calls[0][0].output_compression).toBe(80);
  });

  it("clamps n between 1 and 10", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfig: vi.fn().mockReturnValue({
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        images: { generate: mockGen },
      })),
    }));

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: 50,
      }),
    });

    await POST(request as never);
    expect(mockGen.mock.calls[0][0].n).toBe(10);
  });
});
