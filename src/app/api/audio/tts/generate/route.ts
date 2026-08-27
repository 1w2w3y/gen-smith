import { NextRequest, NextResponse } from "next/server";
import { getModelConfigForFamily } from "@/lib/config";
import { getAuthHeaders } from "@/lib/auth";
import { trackGeneration, trackException } from "@/lib/telemetry";
import { TTS_FORMATS, TTS_VOICES } from "@/types/tts";

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
      input,
      voice = "alloy",
      speed,
      responseFormat = "mp3",
      instructions,
    } = body;
    requestModelId = modelId ?? "unknown";

    if (
      typeof modelId !== "string" ||
      !modelId.trim() ||
      typeof input !== "string" ||
      !input.trim()
    ) {
      return badRequest("modelId and input are required");
    }

    if (!TTS_VOICES.includes(voice)) {
      return badRequest(`Invalid voice. Expected one of: ${TTS_VOICES.join(", ")}`);
    }

    if (!TTS_FORMATS.includes(responseFormat)) {
      return badRequest(`Invalid responseFormat. Expected one of: ${TTS_FORMATS.join(", ")}`);
    }

    let parsedSpeed: number | undefined;
    if (speed !== undefined) {
      if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0.25 || speed > 4.0) {
        return badRequest("speed must be a number between 0.25 and 4.0");
      }
      parsedSpeed = speed;
    }

    const modelConfig = getModelConfigForFamily("tts", modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: { code: "not_found", message: `Model ${modelId} not found in config` } },
        { status: 404 }
      );
    }

    const authHeaders = await getAuthHeaders(modelConfig, "api-key");

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

    if (parsedSpeed !== undefined) requestBody.speed = parsedSpeed;
    if (instructions) requestBody.instructions = instructions;

    console.log(`[api/audio/tts/generate] Calling Azure TTS at ${url}`);

    const hasInstructions =
      typeof instructions === "string" && instructions.length > 0;
    const inputData = [
      ...(hasInstructions
        ? [{ role: "system", content: instructions as string }]
        : []),
      { role: "user", content: input },
    ];
    const promptTemplate = [
      ...(hasInstructions
        ? [{ role: "system", content: "{{instructions}}" }]
        : []),
      { role: "user", content: "{{input}}" },
    ];
    const promptVariables = {
      input,
      ...(hasInstructions ? { instructions: instructions as string } : {}),
    };

    const { traceModelCall } = await import("@/lib/datadog");
    return await traceModelCall(
      {
        operationName: "azure-openai.audio.speech",
        modelName: modelConfig.deploymentName,
        modelProvider: "azure_openai",
        inputData,
        prompt: {
          id: "tts-speech-generation",
          template: promptTemplate,
          variables: promptVariables,
        },
        metadata: {
          voice,
          responseFormat,
          ...(parsedSpeed !== undefined ? { speed: parsedSpeed } : {}),
        },
        tags: { modelFamily: "tts", modelId },
      },
      async ({ annotateOutput, markError }) => {
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
            `TTS API returned ${response.status}`;
          markError(message);
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

        annotateOutput(
          `Generated ${responseFormat} audio`,
          { audioBytes: audioBuffer.byteLength }
        );

        trackGeneration("TTSGeneration", {
          modelId,
          deploymentName: modelConfig.deploymentName,
          voice,
          speed: parsedSpeed !== undefined ? String(parsedSpeed) : "",
          responseFormat,
        }, {
          durationMs,
          inputLength: input.length,
        });

        return NextResponse.json({
          audio: base64Audio,
          format: responseFormat,
        });
      }
    );
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
