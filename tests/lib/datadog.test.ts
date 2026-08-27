import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const span = { setTag: vi.fn() };
  const annotate = vi.fn();
  const trace = vi.fn(
    (_options: unknown, callback: (activeSpan: { setTag: typeof span.setTag }) => unknown) =>
      callback(span)
  );

  return { annotate, span, trace };
});

vi.mock("dd-trace", () => ({
  default: {
    llmobs: {
      annotate: mocks.annotate,
      trace: mocks.trace,
    },
  },
}));

import { extractUsageMetrics, traceModelCall } from "@/lib/datadog";

describe("Datadog Agent Observability helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not load tracing behavior when Agent Observability is disabled", async () => {
    vi.stubEnv("DD_LLMOBS_ENABLED", "false");
    const call = vi.fn().mockResolvedValue("result");

    await expect(
      traceModelCall(
        {
          operationName: "model.generate",
          modelName: "test-model",
          modelProvider: "test-provider",
          inputData: "hello",
          prompt: {
            id: "test-prompt",
            template: "{{input}}",
            variables: { input: "hello" },
          },
        },
        call
      )
    ).resolves.toBe("result");

    expect(call).toHaveBeenCalledOnce();
    expect(mocks.trace).not.toHaveBeenCalled();
  });

  it("creates and annotates an LLM span when enabled", async () => {
    vi.stubEnv("DD_LLMOBS_ENABLED", "true");

    const result = await traceModelCall(
      {
        operationName: "model.generate",
        modelName: "test-model",
        modelProvider: "test-provider",
        inputData: [{ role: "user", content: "hello" }],
        prompt: {
          id: "test-prompt",
          template: "{{input}}",
          variables: { input: "hello" },
        },
        metadata: { temperature: 0.5 },
        tags: { modelFamily: "test" },
      },
      async ({ annotateOutput }) => {
        annotateOutput("done", { totalTokens: 3 });
        return "result";
      }
    );

    expect(result).toBe("result");
    expect(mocks.trace).toHaveBeenCalledWith(
      {
        kind: "llm",
        name: "model.generate",
        modelName: "test-model",
        modelProvider: "test-provider",
      },
      expect.any(Function)
    );
    expect(mocks.annotate).toHaveBeenNthCalledWith(
      1,
      mocks.span,
      expect.objectContaining({
        inputData: [{ role: "user", content: "hello" }],
        prompt: expect.objectContaining({ id: "test-prompt" }),
      })
    );
    expect(mocks.annotate).toHaveBeenNthCalledWith(2, mocks.span, {
      outputData: [{ role: "assistant", content: "done" }],
      metrics: { totalTokens: 3 },
      metadata: undefined,
    });
  });

  it("maps common provider usage fields to Datadog token metrics", () => {
    expect(
      extractUsageMetrics({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      })
    ).toEqual({ inputTokens: 10, outputTokens: 20, totalTokens: 30 });
  });
});
