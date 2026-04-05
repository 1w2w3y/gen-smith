# Stage 1: Install dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# --- Model configuration via environment variables ---
# Set *_ENDPOINT to enable a model family. Only enabled families appear in the UI.
#
# GPT Image (API key auth):
#   GEN_SMITH_GPT_IMAGE_ENDPOINT    - Azure OpenAI endpoint
#   GEN_SMITH_GPT_IMAGE_API_KEY     - API key
#   GEN_SMITH_GPT_IMAGE_DEPLOYMENTS - Comma-separated deployment names (default: gpt-image-1)
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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy config example for reference
COPY --chown=nextjs:nodejs config.example.json ./config.example.json

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
