import { NextRequest, NextResponse } from "next/server";
import { getModelConfig } from "@/lib/config";
import { getApiKey } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelId,
      prompt,
      width = 1024,
      height = 1024,
      n = 1,
    } = body;

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

    const apiKey = await getApiKey(modelConfig);

    // FLUX uses Azure AI Foundry serverless endpoint
    // URL format: {endpoint}/providers/blackforestlabs/v1/{slug}?api-version={version}
    const baseEndpoint = modelConfig.endpoint.replace(/\/+$/, "");
    const apiVersion = modelConfig.apiVersion || "preview";
    const url = `${baseEndpoint}/providers/blackforestlabs/v1/${modelConfig.deploymentName}?api-version=${apiVersion}`;

    const requestBody: Record<string, unknown> = {
      prompt,
      width,
      height,
      n: Math.max(1, Math.min(n, 10)),
      model: modelConfig.id,
    };

    console.log(`[api/image/flux/generate] Calling Azure AI Foundry at ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
    console.error("[api/image/flux/generate] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status: 500 }
    );
  }
}
