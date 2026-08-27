type LlmMessage = {
  role: string;
  content: string;
};

type PromptTracking = {
  id: string;
  template: string | LlmMessage[];
  variables: Record<string, string>;
};

type TraceModelCallOptions = {
  operationName: string;
  modelName: string;
  modelProvider: string;
  inputData: string | LlmMessage[];
  prompt: PromptTracking;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
};

type ModelCallTrace = {
  annotateOutput: (
    content: string,
    metrics?: Record<string, number>,
    metadata?: Record<string, unknown>
  ) => void;
  markError: (error: Error | string) => void;
};

type DatadogSpan = {
  setTag: (name: string, value: unknown) => void;
};

type DatadogTracer = {
  llmobs: {
    annotate: (
      span: DatadogSpan,
      options: Record<string, unknown>
    ) => void;
    trace: <T>(
      options: Record<string, unknown>,
      call: (span: DatadogSpan) => T
    ) => T;
  };
};

const disabledTrace: ModelCallTrace = {
  annotateOutput() {},
  markError() {},
};

let tracerPromise: Promise<DatadogTracer> | undefined;

function isLlmObservabilityEnabled(): boolean {
  const value = process.env.DD_LLMOBS_ENABLED?.toLowerCase();
  return value === "1" || value === "true";
}

function getTracer(): Promise<DatadogTracer> {
  const tracerImportName = "dd-trace";
  tracerPromise ??= import(tracerImportName as string).then(
    (module) => module.default as unknown as DatadogTracer
  );
  return tracerPromise;
}

function annotateInput(
  tracer: DatadogTracer,
  span: DatadogSpan,
  options: TraceModelCallOptions
): void {
  tracer.llmobs.annotate(span, {
    inputData: options.inputData,
    metadata: options.metadata,
    tags: options.tags,
    prompt: options.prompt,
  });
}

export async function traceModelCall<T>(
  options: TraceModelCallOptions,
  call: (trace: ModelCallTrace) => Promise<T>
): Promise<T> {
  if (!isLlmObservabilityEnabled()) {
    return call(disabledTrace);
  }

  const tracer = await getTracer();
  return tracer.llmobs.trace(
    {
      kind: "llm",
      name: options.operationName,
      modelName: options.modelName,
      modelProvider: options.modelProvider,
    },
    async (span) => {
      annotateInput(tracer, span, options);

      return call({
        annotateOutput(content, metrics, metadata) {
          tracer.llmobs.annotate(span, {
            outputData: [{ role: "assistant", content }],
            metrics,
            metadata,
          });
        },
        markError(error) {
          span.setTag(
            "error",
            error instanceof Error ? error : new Error(error)
          );
        },
      });
    }
  );
}

export function extractUsageMetrics(
  usage: unknown
): Record<string, number> {
  if (typeof usage !== "object" || usage === null || Array.isArray(usage)) {
    return {};
  }

  const values = usage as Record<string, unknown>;
  const metrics: Record<string, number> = {};
  const candidates = {
    inputTokens:
      values.input_tokens ?? values.prompt_tokens ?? values.inputTokens,
    outputTokens:
      values.output_tokens ?? values.completion_tokens ?? values.outputTokens,
    totalTokens: values.total_tokens ?? values.totalTokens,
  };

  for (const [name, value] of Object.entries(candidates)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      metrics[name] = value;
    }
  }

  return metrics;
}
