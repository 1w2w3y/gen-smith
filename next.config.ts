import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["applicationinsights", "dd-trace", "openai"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/dd-trace/**/*",
      "./node_modules/@datadog/**/*",
      "./node_modules/dc-polyfill/**/*",
      "./node_modules/import-in-the-middle/**/*",
      "./node_modules/module-details-from-path/**/*",
      "./node_modules/opentracing/**/*",
    ],
  },
};

export default nextConfig;
