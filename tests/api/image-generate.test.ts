import { describe, it, expect, vi, beforeEach } from "vitest";
import OpenAI from "openai";

// Mock the config module
vi.mock("@/lib/config", () => ({
  getModelConfigForFamily: vi.fn(),
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

  it("returns 400 when modelId is an empty or whitespace string", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "   ", prompt: "test" }),
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
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue(null);

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
      AzureCliCredential: vi.fn().mockImplementation(function () {
        return { getToken: mockGetToken };
      }),
      ManagedIdentityCredential: vi.fn(),
    }));

    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

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
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

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
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

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
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

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
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen2 } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

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

  it("returns 400 when n is out of the 1-10 range", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    for (const n of [0, 50]) {
      const request = new Request("http://localhost/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "gpt-image-1",
          prompt: "test",
          n,
        }),
      });

      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status, `n=${n}`).toBe(400);
      expect(data.error.code, `n=${n}`).toBe("bad_request");
    }
  });

  it("passes n through to the Azure call", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
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

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: 3,
      }),
    });

    await POST(request as never);
    expect(mockGen.mock.calls[0][0].n).toBe(3);
  });

  it("returns 400 when n is not a number", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: "abc",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when n is a numeric string", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: "2",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when n is a boolean", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: true,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when n is a non-integer number", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        n: 2.5,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for an invalid size", async () => {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue({
      id: "gpt-image-1",
      displayName: "GPT Image 1",
      endpoint: "https://test.openai.azure.com",
      deploymentName: "gpt-image-1",
      apiVersion: "2024-10-21",
      auth: { type: "apiKey", apiKey: "test-key" },
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        size: "9999x9999",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when an older GPT Image model uses a non-standard size", async () => {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue({
      id: "gpt-image-1.5",
      displayName: "GPT Image 1.5",
      endpoint: "https://test.openai.azure.com",
      deploymentName: "gpt-image-1.5",
      apiVersion: "2024-10-21",
      auth: { type: "apiKey", apiKey: "test-key" },
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1.5",
        prompt: "test",
        size: "1536x864",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("accepts gpt-image-2 arbitrary sizes within the documented constraints", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "gpt-image-2-eastus",
        displayName: "GPT Image 2",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-2",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

    const { POST } = await import("@/app/api/image/generate/route");

    for (const size of ["1536x864", "3840x1280", "auto"]) {
      const request = new Request("http://localhost/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "gpt-image-2",
          prompt: "test",
          size,
        }),
      });

      const response = await POST(request as never);
      expect(response.status, `size ${size}`).toBe(200);
    }

    expect(mockGen.mock.calls[0][0].size).toBe("1536x864");
    expect(mockGen.mock.calls[1][0].size).toBe("3840x1280");
    expect(mockGen.mock.calls[2][0].size).toBe("auto");
  });

  it("applies flexible size rules via the explicit flexibleSize capability", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "custom-image",
        displayName: "Custom Image",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "custom-image-deployment",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
        flexibleSize: true,
      }),
    }));

    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "base64data" }],
      usage: null,
    });

    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "custom-image",
        prompt: "test",
        size: "1536x864",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(mockGen.mock.calls[0][0].size).toBe("1536x864");
  });

  it("opts out of flexible size rules when flexibleSize is false", async () => {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue({
      id: "gpt-image-2",
      displayName: "GPT Image 2",
      endpoint: "https://test.openai.azure.com",
      deploymentName: "gpt-image-2",
      apiVersion: "2024-10-21",
      auth: { type: "apiKey", apiKey: "test-key" },
      flexibleSize: false,
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "1536x864",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  async function mockGptImage2Config() {
    const { getModelConfigForFamily } = await import("@/lib/config");
    vi.mocked(getModelConfigForFamily).mockReturnValue({
      id: "gpt-image-2",
      displayName: "GPT Image 2",
      endpoint: "https://test.openai.azure.com",
      deploymentName: "gpt-image-2",
      apiVersion: "2024-10-21",
      auth: { type: "apiKey", apiKey: "test-key" },
    });
  }

  it("returns 400 for a gpt-image-2 size that is not a multiple of 16", async () => {
    await mockGptImage2Config();

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "1000x1000",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for a gpt-image-2 size with a long edge over 3840", async () => {
    await mockGptImage2Config();
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "3856x1024",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for a gpt-image-2 size with an aspect ratio over 3:1", async () => {
    await mockGptImage2Config();
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "3072x1008",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for a gpt-image-2 size below the minimum pixel count", async () => {
    await mockGptImage2Config();
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "256x256",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when outputCompression is out of range", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        outputFormat: "jpeg",
        outputCompression: 150,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when outputCompression is a string", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        outputFormat: "jpeg",
        outputCompression: "80",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when outputCompression is a non-integer number", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: "test",
        outputFormat: "jpeg",
        outputCompression: 80.5,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("rejects a non-string prompt", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-1",
        prompt: 12345,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 for an invalid quality", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", quality: "hd" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toContain("Invalid quality");
  });

  it("returns 400 for an invalid outputFormat", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", outputFormat: "gif" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toContain("Invalid outputFormat");
  });

  it("returns 400 for an invalid background", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", background: "holographic" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toContain("Invalid background");
  });

  it("returns 400 for an invalid moderation", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", moderation: "high" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toContain("Invalid moderation");
  });

  it("returns 400 for a gpt-image-2 size above the maximum pixel count", async () => {
    await mockGptImage2Config();

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: "3840x3840",
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
  });

  it("returns 400 when size is not a string", async () => {
    await mockGptImage2Config();

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: "gpt-image-2",
        prompt: "test",
        size: 1024,
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe("size must be a string");
  });

  it("returns 400 when the body is a null JSON value", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
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
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["gpt-image-1"]),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("bad_request");
    expect(data.error.message).toBe("Request body must be a JSON object");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
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
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const trackGeneration = vi.fn();
    vi.doMock("@/lib/telemetry", () => ({
      trackGeneration,
      trackException: vi.fn(),
    }));

    const mockGen = vi.fn().mockResolvedValue({ data: [], usage: null });
    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", n: 2 }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("empty_response");
    // An empty result is a failure — it must not be counted as a generation.
    expect(trackGeneration).not.toHaveBeenCalled();
  });

  it("records the number of images actually returned, not the number requested", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      getModelConfigForFamily: vi.fn().mockReturnValue({
        id: "gpt-image-1",
        displayName: "GPT Image 1",
        endpoint: "https://test.openai.azure.com",
        deploymentName: "gpt-image-1",
        apiVersion: "2024-10-21",
        auth: { type: "apiKey", apiKey: "test-key" },
      }),
    }));

    const trackGeneration = vi.fn();
    vi.doMock("@/lib/telemetry", () => ({
      trackGeneration,
      trackException: vi.fn(),
    }));

    // Requested 3, upstream returns 2.
    const mockGen = vi.fn().mockResolvedValue({
      data: [{ b64_json: "one" }, { b64_json: "two" }],
      usage: null,
    });
    vi.doMock("openai", () => {
      const MockOpenAI = vi.fn().mockImplementation(function () {
        return { images: { generate: mockGen } };
      }) as unknown as typeof OpenAI;
      MockOpenAI.APIError = class APIError extends Error {} as unknown as typeof OpenAI.APIError;
      return { default: MockOpenAI };
    });

    const { POST } = await import("@/app/api/image/generate/route");

    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-image-1", prompt: "test", n: 3 }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);

    expect(trackGeneration).toHaveBeenCalledTimes(1);
    const [eventName, properties, metrics] = trackGeneration.mock.calls[0];
    expect(eventName).toBe("ImageGeneration");
    expect(properties.imageCount).toBe("2");
    expect(metrics.imageCount).toBe(2);
  });
});
