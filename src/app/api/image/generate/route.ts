import { NextRequest, NextResponse } from "next/server";
import { getModelConfigForFamily } from "@/lib/config";
import { getApiKey } from "@/lib/auth";
import { trackGeneration, trackException } from "@/lib/telemetry";
import OpenAI from "openai";
import type { ModelConfig } from "@/types/config";

const STANDARD_SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"];
const GPT_IMAGE_2 = "gpt-image-2";
const GPT_IMAGE_2_SIZE_PATTERN = /^(\d+)x(\d+)$/;
const GPT_IMAGE_2_EDGE_MULTIPLE = 16;
const GPT_IMAGE_2_MAX_LONG_EDGE = 3840;
const GPT_IMAGE_2_MAX_ASPECT_RATIO = 3;
const GPT_IMAGE_2_MIN_PIXELS = 655_360;
const GPT_IMAGE_2_MAX_PIXELS = 8_294_400;
const ALLOWED_QUALITIES = ["low", "medium", "high", "auto"];
const ALLOWED_OUTPUT_FORMATS = ["png", "jpeg", "webp"];
const ALLOWED_BACKGROUNDS = ["auto", "opaque", "transparent"];
const ALLOWED_MODERATIONS = ["low", "auto"];

function badRequest(message: string) {
  return NextResponse.json(
    { error: { code: "bad_request", message } },
    { status: 400 }
  );
}

function isValidGptImage2Size(size: string): boolean {
  const match = GPT_IMAGE_2_SIZE_PATTERN.exec(size);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (
    width % GPT_IMAGE_2_EDGE_MULTIPLE !== 0 ||
    height % GPT_IMAGE_2_EDGE_MULTIPLE !== 0
  ) {
    return false;
  }
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (longEdge > GPT_IMAGE_2_MAX_LONG_EDGE) return false;
  if (longEdge / shortEdge > GPT_IMAGE_2_MAX_ASPECT_RATIO) return false;
  const pixels = width * height;
  return pixels >= GPT_IMAGE_2_MIN_PIXELS && pixels <= GPT_IMAGE_2_MAX_PIXELS;
}

function usesFlexibleSize(modelConfig: ModelConfig, modelId: string): boolean {
  if (modelConfig.flexibleSize !== undefined) return modelConfig.flexibleSize;
  return modelConfig.deploymentName === GPT_IMAGE_2 || modelId === GPT_IMAGE_2;
}

function sizeErrorMessage(size: unknown, flexible: boolean): string | null {
  if (typeof size !== "string") {
    return "size must be a string";
  }
  if (flexible) {
    if (size === "auto" || isValidGptImage2Size(size)) return null;
    return (
      'Invalid size. Use "auto" or a WxH size where both edges are multiples of 16, the long edge is at most 3840, the aspect ratio is at most 3:1, and the pixel count is between 655360 and 8294400.'
    );
  }
  if (STANDARD_SIZES.includes(size)) return null;
  return `Invalid size. Expected one of: ${STANDARD_SIZES.join(", ")}`;
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
      n = 1,
      size = "1024x1024",
      quality = "medium",
      outputFormat = "png",
      outputCompression,
      background = "auto",
      moderation = "auto",
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

    if (!ALLOWED_QUALITIES.includes(quality)) {
      return badRequest(
        `Invalid quality. Expected one of: ${ALLOWED_QUALITIES.join(", ")}`
      );
    }
    if (!ALLOWED_OUTPUT_FORMATS.includes(outputFormat)) {
      return badRequest(
        `Invalid outputFormat. Expected one of: ${ALLOWED_OUTPUT_FORMATS.join(", ")}`
      );
    }
    if (!ALLOWED_BACKGROUNDS.includes(background)) {
      return badRequest(
        `Invalid background. Expected one of: ${ALLOWED_BACKGROUNDS.join(", ")}`
      );
    }
    if (!ALLOWED_MODERATIONS.includes(moderation)) {
      return badRequest(
        `Invalid moderation. Expected one of: ${ALLOWED_MODERATIONS.join(", ")}`
      );
    }

    if (
      typeof n !== "number" ||
      !Number.isInteger(n) ||
      n < 1 ||
      n > 10
    ) {
      return badRequest("n must be an integer between 1 and 10");
    }
    const imageCount = n;

    if (
      outputCompression !== undefined &&
      (typeof outputCompression !== "number" ||
        !Number.isInteger(outputCompression) ||
        outputCompression < 0 ||
        outputCompression > 100)
    ) {
      return badRequest("outputCompression must be an integer between 0 and 100");
    }

    const modelConfig = getModelConfigForFamily("gpt-image", modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: { code: "not_found", message: `Model ${modelId} not found in config` } },
        { status: 404 }
      );
    }

    const sizeError = sizeErrorMessage(size, usesFlexibleSize(modelConfig, modelId));
    if (sizeError) {
      return badRequest(sizeError);
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
      n: imageCount,
      size,
      quality,
      output_format: outputFormat,
      background,
      moderation,
      stream: false,
    };

    if (
      (outputFormat === "jpeg" || outputFormat === "webp") &&
      outputCompression !== undefined
    ) {
      params.output_compression = outputCompression;
    }

    console.log(`[api/image/generate] Calling Azure OpenAI at ${baseURL} with deployment ${modelConfig.deploymentName}`);

    const startTime = Date.now();
    const result = await client.images.generate(
      params as unknown as OpenAI.Images.ImageGenerateParamsNonStreaming
    );
    const durationMs = Date.now() - startTime;

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: { code: "empty_response", message: "No images returned from API" } },
        { status: 500 }
      );
    }

    trackGeneration("ImageGeneration", {
      modelId,
      deploymentName: modelConfig.deploymentName,
      size,
      quality,
      outputFormat,
      background,
      moderation,
      imageCount: String(result.data.length),
    }, {
      durationMs,
      promptLength: prompt.length,
      imageCount: result.data.length,
    });

    const images = result.data.map((img, index) => ({
      b64_json: img.b64_json ?? "",
      index,
    }));

    return NextResponse.json({
      images,
      usage: (result as unknown as Record<string, unknown>).usage ?? null,
    });
  } catch (error: unknown) {
    console.error("[api/image/generate] Error:", error);

    trackException(
      error instanceof Error ? error : new Error(String(error)),
      { modelFamily: "gpt-image", modelId: requestModelId }
    );

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
