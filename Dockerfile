# Stage 1: Install dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:24-alpine AS runner
WORKDIR /app

# Refuse to build on a Node.js older than the October 2026 security release
# (24.22.1): it fixes the bundled-Brotli RCE (CVE-2026-111497) and blocks the
# compromised eMudhra intermediates. Node 24 also bundles Brotli 1.2.0, where
# Node 22 is still on 1.1.0 (CVE-2025-6176).
RUN node -e 'const [a, b, c] = process.versions.node.split(".").map(Number); \
    if (a * 1e6 + b * 1e3 + c < 24022001) { \
      console.error("Node " + process.version + " is older than 24.22.1"); process.exit(1); }'

# Patch OS packages, drop eMudhra (emSign) roots from the system CA bundle, and
# drop the npm/npx/corepack/yarn toolchains bundled with the base image: the
# app runs with plain `node`, and their vendored deps are the bulk of the
# image's library CVEs. The app only talks to Azure and Datadog, neither of
# which chains to eMudhra.
RUN apk upgrade --no-cache && \
    node -e 'const fs = require("fs"), { X509Certificate } = require("crypto"); \
      const f = "/etc/ssl/certs/ca-certificates.crt"; \
      const pems = fs.readFileSync(f, "utf8").match(/-----BEGIN CERTIFICATE-----[^-]+-----END CERTIFICATE-----\n?/g); \
      fs.writeFileSync(f, pems.filter((p) => !/eMudhra/i.test(new X509Certificate(p).subject)).join(""));' && \
    rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DD_LLMOBS_ENABLED=true
ENV DD_LLMOBS_AGENTLESS_ENABLED=true
ENV DD_LLMOBS_ML_APP=gen-smith
ENV DD_SITE=us3.datadoghq.com
ENV NODE_OPTIONS="--import dd-trace/initialize.mjs"

# --- Model configuration via environment variables ---
# Set *_ENDPOINT to enable a model family. Only enabled families appear in the UI.
#
# GPT Image (API key auth):
#   GEN_SMITH_GPT_IMAGE_ENDPOINT    - Azure OpenAI endpoint
#   GEN_SMITH_GPT_IMAGE_API_KEY     - API key
#   GEN_SMITH_GPT_IMAGE_DEPLOYMENTS - Comma-separated deployment names (default: gpt-image-2)
#   GEN_SMITH_GPT_IMAGE_API_VERSION - API version (default: 2024-10-21)
#
# FLUX Image:
#   GEN_SMITH_FLUX_IMAGE_ENDPOINT    - Azure AI Foundry endpoint
#   GEN_SMITH_FLUX_IMAGE_API_KEY     - API key
#   GEN_SMITH_FLUX_IMAGE_DEPLOYMENTS - Comma-separated (default: FLUX.2-pro)
#   GEN_SMITH_FLUX_IMAGE_API_VERSION - API version (default: preview)
#
# TTS:
#   GEN_SMITH_TTS_ENDPOINT    - Azure Cognitive Services endpoint
#   GEN_SMITH_TTS_API_KEY     - API key
#   GEN_SMITH_TTS_DEPLOYMENTS - Comma-separated (default: gpt-4o-mini-tts)
#   GEN_SMITH_TTS_API_VERSION - API version (default: 2025-03-01-preview)
#
# Azure CLI / Managed Identity auth:
#   GEN_SMITH_<FAMILY>_AUTH_TYPE  - "apiKey" (default), "azureCli", or "managedIdentity"
#   GEN_SMITH_<FAMILY>_CLIENT_ID - Client ID for managed identity (optional)
#
# Alternatively, mount a config.json at /app/config.json for advanced config.
# If both exist for the same family, config.json takes precedence.

RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Copy the standalone output
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy config example for reference
COPY --chown=nextjs:nodejs config.example.json ./config.example.json

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
