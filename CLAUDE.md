# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gen-smith is a lightweight web playground for generative AI models (image generation and TTS) deployed on Azure AI Foundry. Users configure model endpoints in a JSON file and interact with them through per-model-family playground pages.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- **AI SDK**: `openai` npm package (`AzureOpenAI` client), `@azure/identity` for Entra ID auth
- **Package Manager**: npm
- **Testing**: Vitest

## Key Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm test          # Run tests
```

## Project Structure

- `src/app/` — Next.js pages and API routes
  - `image/gpt/`, `image/mai/`, `image/flux/` — Image generation playgrounds
  - `audio/tts/` — TTS playground
  - `api/` — Server-side API routes (authenticated proxy to Azure)
- `src/components/` — React components (ui/, layout/, image/, audio/)
- `src/lib/` — Config loader, auth factory, provider abstraction
- `src/hooks/` — React hooks for API calls and state
- `src/types/` — TypeScript type definitions
- `config.json` — User's model configuration (gitignored)
- `config.example.json` — Template config (committed)

## Documentation

- [PRD](docs/PRD.md) — Product requirements and feature priorities
- [Design Doc](docs/DESIGN.md) — Technical architecture and design decisions
