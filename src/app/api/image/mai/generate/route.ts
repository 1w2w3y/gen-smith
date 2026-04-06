import { NextRequest, NextResponse } from "next/server";
import { getModelConfig } from "@/lib/config";
import { getApiKey } from "@/lib/auth";
import { trackGeneration, trackException } from "@/lib/telemetry";

export async function POST(request: NextRequest) {
  let requestModelId = "unknown";
  try {
    const body = await request.json();
    const {
      modelId,
      prompt,
      width = 1024,
      height = 1024,
    } = body;
    requestModelId = modelId ?? "unknown";

    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "modelId and prompt are required" } },
        { status: 400 }
      );
    }

    const modelConfig = getModelConfig(modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: { code: "not_found", message: `Model ${modelId} not found in config` } },
        { status: 404 }
      );
    }

    const apiKeyOrToken = await getApiKey(modelConfig);

    // MAI-Image-2 URL: {endpoint}/mai/v1/images/generations
    const baseEndpoint = modelConfig.endpoint.replace(/\/+$/, "");
    const url = `${baseEndpoint}/mai/v1/images/generations`;

    const requestBody = {
      model: modelConfig.deploymentName,
      prompt,
      width,
      height,
    };

    // Auth header differs by auth type:
    // - apiKey: use "api-key" header
    // - azureCli/managedIdentity: use "Authorization: Bearer" header
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (modelConfig.auth.type === "apiKey") {
      headers["api-key"] = apiKeyOrToken;
    } else {
      headers["Authorization"] = `Bearer ${apiKeyOrToken}`;
    }

    console.log(`[api/image/mai/generate] Calling MAI-Image-2 at ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        errorBody?.error?.message ||
        errorBody?.message ||
        `MAI Image API returned ${response.status}`;
      console.error("[api/image/mai/generate] Error:", message);
      return NextResponse.json(
        { error: { code: "api_error", message } },
        { status: response.status }
      );
    }

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    trackGeneration("MaiImageGeneration", {
      modelId,
      deploymentName: modelConfig.deploymentName,
      prompt,
      width: String(width),
      height: String(height),
      imageCount: "1",
    }, {
      durationMs,
      promptLength: prompt.length,
      imageCount: 1,
    });

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: { code: "empty_response", message: "No images returned from API" } },
        { status: 500 }
      );
    }

    const images = result.data.map(
      (img: { b64_json?: string }, index: number) => ({
        b64_json: img.b64_json ?? "",
        index,
      })
    );

    return NextResponse.json({
      images,
      usage: result.usage ?? null,
    });
  } catch (error: unknown) {
    console.error("[api/image/mai/generate] Error:", error);

    trackException(
      error instanceof Error ? error : new Error(String(error)),
      { modelFamily: "mai-image", modelId: requestModelId }
    );

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status: 500 }
    );
  }
}
