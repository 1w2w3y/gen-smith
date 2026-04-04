import { NextRequest, NextResponse } from "next/server";
import { getModelConfig } from "@/lib/config";
import type { ModelConfig } from "@/types/config";
import OpenAI from "openai";

async function getApiKey(modelConfig: ModelConfig): Promise<string> {
  if (modelConfig.auth.type === "apiKey") {
    return modelConfig.auth.apiKey!;
  }

  // azureCli or managedIdentity: get a token via @azure/identity
  const { AzureCliCredential, ManagedIdentityCredential } = await import("@azure/identity");

  const credential =
    modelConfig.auth.type === "azureCli"
      ? new AzureCliCredential()
      : new ManagedIdentityCredential(modelConfig.auth.clientId);

  const tokenResponse = await credential.getToken(
    "https://cognitiveservices.azure.com/.default"
  );
  return tokenResponse.token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelId,
      prompt,
      n = 1,
      size = "1024x1024",
      quality = "medium",
      outputFormat = "png",
      outputCompression,
      background = "auto",
      moderation = "auto",
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

    // Build the OpenAI client pointing at the Azure endpoint
    // The endpoint format is: https://<resource>.openai.azure.com
    // The OpenAI SDK will append /images/generations to the baseURL
    const baseURL = `${modelConfig.endpoint.replace(/\/+$/, "")}/openai/v1`;

    const apiKey = await getApiKey(modelConfig);

    const client = new OpenAI({
      apiKey,
      baseURL,
    });

    const params: Record<string, unknown> = {
      model: modelConfig.deploymentName,
      prompt,
      n: Math.max(1, Math.min(n, 10)),
      size,
      quality,
      output_format: outputFormat,
      background,
      moderation,
    };

    if (
      (outputFormat === "jpeg" || outputFormat === "webp") &&
      outputCompression !== undefined
    ) {
      params.output_compression = outputCompression;
    }

    console.log(`[api/image/generate] Calling Azure OpenAI at ${baseURL} with deployment ${modelConfig.deploymentName}`);

    const result = await client.images.generate(
      params as OpenAI.Images.ImageGenerateParams
    );

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: { code: "empty_response", message: "No images returned from API" } },
        { status: 500 }
      );
    }

    const images = result.data.map((img, index) => ({
      b64_json: img.b64_json ?? "",
      index,
    }));

    return NextResponse.json({
      images,
      usage: (result as Record<string, unknown>).usage ?? null,
    });
  } catch (error: unknown) {
    console.error("[api/image/generate] Error:", error);

    let message = "An unexpected error occurred";
    let status = 500;

    if (error instanceof OpenAI.APIError) {
      message = error.message;
      status = error.status ?? 500;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status }
    );
  }
}
