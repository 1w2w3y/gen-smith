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
      input,
      voice = "alloy",
      speed,
      responseFormat = "mp3",
      instructions,
    } = body;
    requestModelId = modelId ?? "unknown";

    if (!modelId || !input) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "modelId and input are required" } },
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

    // TTS uses Azure OpenAI deployment-specific endpoint
    const baseEndpoint = modelConfig.endpoint.replace(/\/+$/, "");
    const apiVersion = modelConfig.apiVersion || "2025-03-01-preview";
    const url = `${baseEndpoint}/openai/deployments/${modelConfig.deploymentName}/audio/speech?api-version=${apiVersion}`;

    const requestBody: Record<string, unknown> = {
      model: modelConfig.deploymentName,
      input,
      voice,
      response_format: responseFormat,
    };

    if (speed !== undefined) requestBody.speed = speed;
    if (instructions) requestBody.instructions = instructions;

    console.log(`[api/audio/tts/generate] Calling Azure TTS at ${url}`);

    const startTime = Date.now();
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
        `TTS API returned ${response.status}`;
      console.error("[api/audio/tts/generate] Error:", message);
      return NextResponse.json(
        { error: { code: "api_error", message } },
        { status: response.status }
      );
    }

    // TTS returns raw audio binary — convert to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const durationMs = Date.now() - startTime;

    trackGeneration("TTSGeneration", {
      modelId,
      deploymentName: modelConfig.deploymentName,
      input,
      voice,
      speed: speed !== undefined ? String(speed) : "",
      responseFormat,
      instructions: instructions || "",
    }, {
      durationMs,
      inputLength: input.length,
    });

    return NextResponse.json({
      audio: base64Audio,
      format: responseFormat,
    });
  } catch (error: unknown) {
    console.error("[api/audio/tts/generate] Error:", error);

    trackException(
      error instanceof Error ? error : new Error(String(error)),
      { modelFamily: "tts", modelId: requestModelId }
    );

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status: 500 }
    );
  }
}
