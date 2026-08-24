import { NextRequest, NextResponse } from "next/server";
import { getModelConfigForFamily } from "@/lib/config";
import { getAuthHeaders } from "@/lib/auth";
import { trackGeneration, trackException } from "@/lib/telemetry";
import { detectBase64ImageFormat } from "@/lib/image-format";

function badRequest(message: string) {
  return NextResponse.json(
    { error: { code: "bad_request", message } },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  let requestModelId = "unknown";
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return badRequest("Request body must be a JSON object");
    }
    const {
      modelId,
      prompt,
      width = 1024,
      height = 1024,
    } = body;
    requestModelId = modelId ?? "unknown";

    if (
      typeof modelId !== "string" ||
      !modelId.trim() ||
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return badRequest("modelId and prompt are required");
    }

    if (
      !Number.isInteger(width) || width < 1 || width > 4096 ||
      !Number.isInteger(height) || height < 1 || height > 4096
    ) {
      return badRequest("width and height must be integers between 1 and 4096");
    }

    const modelConfig = getModelConfigForFamily("flux-image", modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: { code: "not_found", message: `Model ${modelId} not found in config` } },
        { status: 404 }
      );
    }

    const authHeaders = await getAuthHeaders(modelConfig, "bearer");

    // FLUX uses Azure AI Foundry serverless endpoint
    // URL format: {endpoint}/providers/blackforestlabs/v1/{slug}?api-version={version}
    const baseEndpoint = modelConfig.endpoint.replace(/\/+$/, "");
    const apiVersion = modelConfig.apiVersion || "preview";
    const url = `${baseEndpoint}/providers/blackforestlabs/v1/${modelConfig.deploymentName}?api-version=${apiVersion}`;

    const requestBody: Record<string, unknown> = {
      prompt,
      width,
      height,
      model: modelConfig.id,
    };

    console.log(`[api/image/flux/generate] Calling Azure AI Foundry at ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        errorBody?.error?.message ||
        errorBody?.message ||
        `FLUX API returned ${response.status}`;
      console.error("[api/image/flux/generate] Error:", message);
      return NextResponse.json(
        { error: { code: "api_error", message } },
        { status: response.status }
      );
    }

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: { code: "empty_response", message: "No images returned from API" } },
        { status: 500 }
      );
    }

    trackGeneration("FluxImageGeneration", {
      modelId,
      deploymentName: modelConfig.deploymentName,
      width: String(width),
      height: String(height),
      imageCount: String(result.data.length),
    }, {
      durationMs,
      promptLength: prompt.length,
      imageCount: result.data.length,
    });

    const images = result.data.map(
      (img: { b64_json?: string }, index: number) => ({
        b64_json: img.b64_json ?? "",
        index,
        format: detectBase64ImageFormat(img.b64_json ?? ""),
      })
    );

    return NextResponse.json({
      images,
      usage: result.usage ?? null,
    });
  } catch (error: unknown) {
    console.error("[api/image/flux/generate] Error:", error);

    trackException(
      error instanceof Error ? error : new Error(String(error)),
      { modelFamily: "flux-image", modelId: requestModelId }
    );

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status: 500 }
    );
  }
}
