# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gen-smith is a lightweight web playground for generative AI models (image generation and TTS) deployed on Azure AI Foundry. Users configure model endpoints in a JSON file and interact with them through per-model-family playground pages.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- **AI SDK**: `openai` npm package for GPT Image models, direct `fetch()` for FLUX and TTS
- **Auth**: `@azure/identity` for Azure CLI / Entra ID / managed identity authentication
- **Package Manager**: npm
- **Testing**: Vitest + Testing Library (67 tests across 11 files)

## Key Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm test          # Run tests (vitest)
```

## Project Structure

- `src/app/` — Next.js pages and API routes
  - `image/gpt/` — GPT Image playground (gpt-image-1.5, gpt-image-1, gpt-image-1-mini)
  - `image/flux/` — FLUX Image playground (FLUX.2-pro, FLUX.2-flex)
  - `audio/tts/` — TTS playground (gpt-4o-mini-tts)
  - `api/image/generate/` — GPT Image API route (OpenAI SDK)
  - `api/image/flux/generate/` — FLUX API route (direct REST to Azure AI Foundry serverless)
  - `api/audio/tts/generate/` — TTS API route (direct REST to Azure Cognitive Services)
  - `api/config/` — Returns sanitized config (no secrets)
- `src/components/` — React components
  - `ui/` — shadcn/ui primitives (Button, Card, Select, Slider, etc.)
  - `layout/` — Navbar, ThemeProvider
  - `image/` — GenerationForm (GPT), FluxGenerationForm, ImageOutput (shared)
  - `audio/` — TTSForm, AudioOutput
- `src/hooks/` — Custom React hooks
  - `useGenerateImage.ts` — GPT Image generation
  - `useGenerateFluxImage.ts` — FLUX image generation
  - `useGenerateSpeech.ts` — TTS speech generation
- `src/lib/` — Shared utilities
  - `config.ts` — Config loader, model lookup, sanitizer
  - `auth.ts` — Shared auth helper (API key, Azure CLI, managed identity)
  - `utils.ts` — Tailwind `cn()` utility
- `src/types/` — TypeScript type definitions
  - `config.ts` — Config types (AppConfig, ModelConfig, auth types)
  - `image.ts` — GPT Image types (sizes, quality, formats)
  - `flux.ts` — FLUX types (width/height request)
  - `tts.ts` — TTS types (voices, formats)
- `config.json` — User's model configuration (gitignored)
- `config.example.json` — Template config (committed)

## API Endpoint Patterns

Each model family uses a different Azure endpoint:

| Family    | Endpoint Pattern | Client |
|-----------|-----------------|--------|
| GPT Image | `{endpoint}/openai/v1/images/generations` | OpenAI SDK |
| FLUX      | `{endpoint}/providers/blackforestlabs/v1/{slug}?api-version=preview` | `fetch()` |
| TTS       | `{endpoint}/openai/deployments/{deployment}/audio/speech?api-version={ver}` | `fetch()` |

## Documentation

- [PRD](docs/PRD.md) — Product requirements and feature priorities
- [Design Doc](docs/DESIGN.md) — Technical architecture and design decisions
