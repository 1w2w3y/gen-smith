import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["applicationinsights", "dd-trace", "openai"],
  outputFileTracingIncludes: {
    // The dd-trace / OpenTelemetry preload loads these at runtime via dynamic
    // require, which Next's static file tracer cannot see — every runtime dep
    // of dd-trace and import-in-the-middle (both copies) must be listed here.
    "/*": [
      "./node_modules/@datadog/**/*",
      "./node_modules/acorn/**/*",
      "./node_modules/acorn-import-attributes/**/*",
      "./node_modules/cjs-module-lexer/**/*",
      "./node_modules/dc-polyfill/**/*",
      "./node_modules/dd-trace/**/*",
      "./node_modules/es-module-lexer/**/*",
      "./node_modules/import-in-the-middle/**/*",
      "./node_modules/module-details-from-path/**/*",
      "./node_modules/opentracing/**/*",
    ],
  },
};

export default nextConfig;
