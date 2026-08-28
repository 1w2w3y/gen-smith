import type { NextConfig } from "next";
import { datadogTracingIncludes } from "./scripts/datadog-tracing-includes";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["applicationinsights", "dd-trace", "openai"],
  // dd-trace is loaded by the NODE_OPTIONS preload, which the file tracer
  // cannot see. Include its whole dependency graph or the standalone server
  // crashes before Next starts.
  outputFileTracingIncludes: {
    "/*": datadogTracingIncludes(),
  },
};

export default nextConfig;
