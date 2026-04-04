# gen-smith — Product Requirements Document

| Field   | Value          |
|---------|----------------|
| Status  | Draft          |
| Date    | 2026-04-03     |
| Version | 0.1            |

## Problem Statement

Developers and AI practitioners who have deployed generative AI models on Azure AI Foundry lack a unified, lightweight UI for rapid experimentation. Existing options are either model-specific (e.g., OpenAI Playground) or heavyweight (Azure AI Studio). There is no simple, local-first tool that lets a developer point at multiple model deployments and quickly iterate on prompts and parameters across model families.

## Target Users

- **Primary**: AI/ML developers and engineers with Azure AI Foundry deployments who want to quickly test prompts, compare outputs, and tune parameters
- **Secondary**: Product managers and designers evaluating model outputs for product decisions
- **Tertiary**: Students and researchers experimenting with generative AI capabilities

## Goals

1. Provide a unified playground for image generation and audio generation models deployed on Azure AI Foundry
2. Support multiple model families (GPT Image, MAI Image, FLUX, TTS) through a single interface with per-family pages
3. Enable rapid experimentation with different models, parameters, and prompts
4. Track generation history with metadata for comparison
5. Support flexible authentication methods suitable for enterprise environments
6. Allow simple JSON-based configuration — only configured models are visible

## Non-Goals

- Not a production-grade application for end users
- Not a model training, fine-tuning, or deployment tool
- Not a multi-user or team collaboration platform (single-user, local-first)
- Not supporting non-Azure providers in v1 (extensibility planned for later)
- Not a model management tool — use the Azure AI Foundry portal for that

---

## Feature Requirements

### P0 — Must Have (MVP)

- **GPT Image playground page**
  - Model selector: gpt-image-1.5, gpt-image-1, gpt-image-1-mini
  - Prompt textarea
  - Image count (1–10)
  - Size presets (Auto, 1024x1024, 1536x1024, 1024x1536)
  - Quality selector (Auto, Low, Medium, High)
  - Output format (PNG, JPEG, WebP)
  - Generate button with loading state
  - Image display grid with individual download
- **Authentication**: API key and Entra ID (Azure CLI token) — both supported from day one
- **JSON configuration file** (`config.json`) for model endpoints and auth
- **Dynamic UI**: unconfigured models hidden from navigation
- **Two-column layout**: form on left, output on right
- **Light/dark theme toggle**
- **Error handling**: structured error display, content filter rejection feedback, network error handling

### P1 — Should Have (v1.0)

- **MAI Image playground page** (MAI-Image-2) with model-specific parameters
- **FLUX Image playground page** (FLUX.2-pro, FLUX.2-flex) with model-specific parameters
- **TTS playground page** (gpt-4o-mini-tts)
  - Text input, voice selector (alloy, echo, fable, onyx, nova, shimmer)
  - Speed control, instructions for style/tone guidance
  - Audio player with download
  - Output format selection (mp3, opus, aac, flac, wav)
- **Image editing / inpainting**
  - Canvas-based mask editor (draw on image, adjustable brush size)
  - Upload PNG mask option
  - Edit prompt input
- **Additional image controls**: background type (transparent, opaque, auto), output compression slider, moderation level selector
- **Generation history panel** with thumbnails, metadata badges, prompt viewer
- **Batch image download**
- **Managed identity authentication** (default / system-assigned)

### P2 — Nice to Have (Future)

- Cost tracking and token usage display in history
- Managed identity with specific client ID
- Chinese language support (i18n framework)
- Additional provider support beyond Azure AI Foundry
- Prompt templates and saved presets
- Side-by-side model comparison
- Image-to-image reference input for FLUX models
- Keyboard shortcuts

---

## Model Support Matrix

| Model             | Page       | Provider             | API Type             | Key Parameters                                                                     |
|-------------------|------------|----------------------|----------------------|------------------------------------------------------------------------------------|
| gpt-image-1.5     | GPT Image  | Azure OpenAI         | images/generations   | prompt, n, size, quality, output_format, output_compression, background, moderation |
| gpt-image-1       | GPT Image  | Azure OpenAI         | images/generations   | prompt, n, size, quality, output_format, output_compression, background, moderation |
| gpt-image-1-mini  | GPT Image  | Azure OpenAI         | images/generations   | prompt, n, size, quality, output_format, output_compression, background, moderation |
| MAI-Image-2       | MAI Image  | Azure AI Foundry     | model inference      | prompt, size, (model-specific TBD)                                                 |
| FLUX.2-pro        | FLUX Image | Azure AI Foundry     | model inference      | prompt, width, height, steps, guidance_scale, seed                                 |
| FLUX.2-flex       | FLUX Image | Azure AI Foundry     | model inference      | prompt, width, height, steps, guidance_scale, seed                                 |
| gpt-4o-mini-tts   | TTS        | Azure OpenAI         | audio/speech         | input, voice, speed, response_format, instructions                                 |

---

## Authentication Requirements

| Auth Method                   | How It Works                                                                 | Priority |
|-------------------------------|-----------------------------------------------------------------------------|----------|
| API Key                       | User provides key in config, sent as `api-key` header                       | P0       |
| Entra ID (Azure CLI)          | `DefaultAzureCredential` picks up `az login` session                        | P0       |
| Managed Identity (default)    | `DefaultAzureCredential` with system-assigned managed identity              | P1       |
| Managed Identity (client ID)  | `ManagedIdentityCredential` with specific `clientId`                        | P2       |

Auth scope for Entra ID / managed identity: `https://cognitiveservices.azure.com/.default`

---

## Configuration Schema

Top-level structure of `config.json`:

```jsonc
{
  "models": {
    "<page-slug>": {
      "enabled": true,
      "displayName": "Display Name",
      "models": [
        {
          "id": "model-id",
          "displayName": "Model Display Name",
          "endpoint": "https://<resource>.openai.azure.com",
          "deploymentName": "deployment-name",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "apiKey" | "azureCli" | "managedIdentity",
            "apiKey": "...",         // only for type: apiKey
            "clientId": "..."        // only for type: managedIdentity with specific identity
          }
        }
      ]
    }
  }
}
```

Rules:
- Page slugs: `gpt-image`, `mai-image`, `flux-image`, `tts`
- A page not present in config or with `enabled: false` is hidden from the navigation
- Auth is per-model (same page may have models in different Azure resources)
- `config.json` is gitignored; `config.example.json` is committed with placeholder values

---

## Phases and Milestones

### Phase 1 — MVP

- GPT Image playground page with full generation controls
- API key + Entra ID authentication
- JSON config file with dynamic UI hiding
- Two-column responsive layout
- Light/dark theme
- Basic error handling

### Phase 2 — Multi-Model

- MAI Image playground page
- FLUX Image playground page
- TTS playground page
- Image editing / inpainting with mask editor
- Generation history panel

### Phase 3 — Auth and Polish

- Managed identity authentication (default)
- Cost tracking and token usage
- Batch download
- Moderation controls

### Phase 4 — Extensibility

- i18n framework with Chinese language support
- Additional model providers beyond Azure AI Foundry
- Prompt templates and presets
- Side-by-side model comparison

---

## Open Questions

1. What is the exact API schema for MAI-Image-2 and FLUX models when accessed via Azure AI Foundry? (May differ from direct provider APIs)
2. Do FLUX models on Azure AI Foundry use the OpenAI-compatible endpoint or a separate inference endpoint?
3. Is cost/token usage data available in API responses for all model types?
4. Should environment variables be supported as an alternative to `config.json` for simpler single-model setups?
