# gen-smith — Technical Design Document

| Field        | Value                  |
|--------------|------------------------|
| Status       | Draft                  |
| Date         | 2026-04-03             |
| Version      | 0.1                    |
| Related Docs | [PRD](PRD.md)          |

## Overview

gen-smith is a Next.js web application that serves as a playground for generative AI models deployed on Azure AI Foundry. It provides separate UI pages for different model families — each with tailored input controls — and connects to Azure endpoints through server-side API routes that keep credentials secure. A JSON configuration file controls which models are available and how they authenticate.

---

## Tech Stack

| Layer        | Choice                          | Rationale                                                                 |
|--------------|----------------------------------|---------------------------------------------------------------------------|
| Framework    | Next.js 15 (App Router)         | Server-side API routes keep secrets off the client; modern React patterns |
| Language     | TypeScript (strict)              | Type safety across config, API contracts, and UI props                    |
| UI Library   | React 19                         | Latest stable React with concurrent features                              |
| Styling      | Tailwind CSS v4                  | Utility-first, no runtime CSS-in-JS overhead                              |
| Components   | shadcn/ui (Radix UI primitives)  | Accessible, composable, unstyled base components                          |
| AI SDK       | `openai` (npm)                   | Official SDK with `AzureOpenAI` client class                              |
| Auth SDK     | `@azure/identity`               | Entra ID, Azure CLI, managed identity support                             |
| Pkg Manager  | npm                              | Included with Node.js, no extra install step                              |
| Testing      | Vitest                           | Fast, ESM-native, compatible with Next.js                                 |
| Linting      | ESLint + Prettier                | Consistent code style                                                     |

---

## Project Structure

```
gen-smith/
  config.example.json           # Template config (committed)
  config.json                   # User's config (gitignored)
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
  docs/
    PRD.md
    DESIGN.md
  public/
    favicon.ico
  src/
    app/
      layout.tsx                # Root layout — nav, theme provider
      page.tsx                  # Home / landing page
      image/
        gpt/
          page.tsx              # GPT Image playground
        mai/
          page.tsx              # MAI Image playground
        flux/
          page.tsx              # FLUX Image playground
      audio/
        tts/
          page.tsx              # TTS playground
      api/
        image/
          generate/
            route.ts            # POST — image generation proxy
          edit/
            route.ts            # POST — image editing proxy
        audio/
          speech/
            route.ts            # POST — TTS proxy
        config/
          route.ts              # GET — sanitized config (no secrets)
    components/
      ui/                       # shadcn/ui primitives (Button, Select, Slider, etc.)
      layout/
        Navbar.tsx              # Top nav with model page links
        ThemeToggle.tsx         # Light/dark mode toggle
        TwoColumnLayout.tsx     # Reusable form + output layout
      image/
        PromptInput.tsx         # Prompt textarea with char count
        ImageGrid.tsx           # Display grid for generated images
        ImageCard.tsx           # Single image with download button
        ModelSelector.tsx       # Model dropdown (filtered by config)
        ParamControls.tsx       # Size, quality, format, compression, etc.
        MaskEditor.tsx          # Canvas-based mask editor for inpainting
        HistoryPanel.tsx        # Generation history list
      audio/
        TextInput.tsx           # Text input for TTS
        VoiceSelector.tsx       # Voice picker dropdown
        AudioPlayer.tsx         # Play / download audio output
        SpeedControl.tsx        # Speed slider
    lib/
      config.ts                 # Load and validate config.json
      auth.ts                   # Auth factory — returns credential based on config
      providers/
        types.ts                # Shared interfaces for provider abstraction
        azure-openai.ts         # AzureOpenAI client wrapper (GPT Image + TTS)
        azure-foundry.ts        # Azure AI Foundry client wrapper (MAI, FLUX)
      models/
        registry.ts             # Maps model IDs to page routes and param defs
        gpt-image.ts            # GPT image parameter definitions and defaults
        mai-image.ts            # MAI image parameter definitions and defaults
        flux-image.ts           # FLUX image parameter definitions and defaults
        tts.ts                  # TTS parameter definitions and defaults
    hooks/
      useGenerateImage.ts       # React hook for image generation API call
      useEditImage.ts           # React hook for image editing API call
      useGenerateSpeech.ts      # React hook for TTS API call
      useConfig.ts              # React hook to fetch sanitized config
      useHistory.ts             # React hook for local generation history
    types/
      config.ts                 # Config file TypeScript types
      image.ts                  # Image generation request/response types
      audio.ts                  # Audio generation request/response types
```

---

## UI Layout and Navigation

### Navbar

Fixed top bar containing:
- Logo / project name ("gen-smith")
- **Image Gen** dropdown: GPT Image, MAI Image, FLUX Image (links hidden if model not configured)
- **Audio Gen** dropdown: TTS (hidden if not configured)
- Theme toggle (light/dark)

### Page Layout

Each playground page uses the shared `TwoColumnLayout` component:

```
+----------------------------------------------+
| Navbar                                       |
+--------------------+-------------------------+
| Left Column        | Right Column            |
| (scrollable form)  | (output display)        |
|                    |                         |
| - Model selector   | - ImageGrid / AudioPlayer|
| - Prompt input     | - ImageCard per result   |
| - Param controls   | - Error display          |
| - Generate button  | - Loading spinner        |
+--------------------+-------------------------+
| History Panel (collapsible)                  |
| - Thumbnails with metadata badges            |
+----------------------------------------------+
```

**Responsive behavior**: On viewports below 768px, columns stack vertically — form on top, output below.

### Component Hierarchy

```
RootLayout
  ThemeProvider
    Navbar
      NavLink (per configured model page)
      ThemeToggle
    <Page>
      TwoColumnLayout
        LeftColumn
          ModelSelector
          PromptInput
          ParamControls (varies per page)
          GenerateButton
        RightColumn
          ImageGrid / AudioPlayer
          ImageCard (per image)
      HistoryPanel
        HistoryItem (per past generation)
```

---

## API / Backend Design

All API routes live in `src/app/api/` and act as an **authenticated proxy**: the client sends generation parameters to the Next.js server, the server adds credentials and forwards the request to Azure, then returns the result. This keeps secrets server-side.

### `POST /api/image/generate`

**Request body**:
```json
{
  "modelId": "gpt-image-1",
  "prompt": "a cat in a spaceship",
  "n": 2,
  "size": "1024x1024",
  "quality": "high",
  "outputFormat": "png",
  "outputCompression": null,
  "background": "auto",
  "moderation": "auto"
}
```

**Server logic**:
1. Look up model config by `modelId`
2. `getCredential(config.auth)` → credential
3. `getProvider(config)` → provider
4. `provider.generateImage({ prompt, ...params })` → calls Azure API
5. Return `{ images: [{ b64_json, revised_prompt }], usage }`

### `POST /api/image/edit`

**Request body**: multipart/form-data with `image` (file), `mask` (file or null), `prompt`, `modelId`, and parameter fields.

**Server logic**: Same auth/provider flow, calls `images.edit()`, returns edited image(s).

### `POST /api/audio/speech`

**Request body**:
```json
{
  "modelId": "gpt-4o-mini-tts",
  "input": "Hello, world!",
  "voice": "alloy",
  "speed": 1.0,
  "responseFormat": "mp3",
  "instructions": "Speak in a cheerful tone"
}
```

**Server logic**: Same auth/provider flow, calls `audio.speech.create()`, returns audio binary stream. Client receives as a blob URL for playback.

### `GET /api/config`

Returns sanitized config: model IDs, display names, enabled flags, page slugs. **No secrets** (no API keys, no endpoints).

Used by the client to determine which navigation items to show.

---

## Authentication Flow

Config specifies auth type per model: `"apiKey"`, `"azureCli"`, or `"managedIdentity"`.

`lib/auth.ts` exports a factory function:

```
getCredential(authConfig) → credential
```

```
API route receives request with modelId
  │
  ▼
Load model config from config.json
  │
  ▼
Read auth.type from model config
  │
  ├── "apiKey"           → Use apiKey string directly in AzureOpenAI({ apiKey })
  │
  ├── "azureCli"         → DefaultAzureCredential()
  │                        picks up az login session
  │
  └── "managedIdentity"  → ManagedIdentityCredential()
                           or ManagedIdentityCredential({ clientId }) if specified
  │
  ▼
Construct provider client with credential
  │
  ▼
Call Azure API
```

Auth scope for Entra ID / managed identity: `https://cognitiveservices.azure.com/.default`

**Note**: `DefaultAzureCredential` supports both Azure CLI and managed identity. Using `"azureCli"` in config selects `DefaultAzureCredential` which works for local dev (az login) and also picks up managed identity when deployed. The `"managedIdentity"` type is reserved for cases where a specific client ID must be provided.

---

## Configuration Schema

`config.json` (gitignored) — `config.example.json` (committed with placeholders):

```jsonc
{
  "models": {
    "gpt-image": {
      "enabled": true,
      "displayName": "GPT Image",
      "models": [
        {
          "id": "gpt-image-1",
          "displayName": "GPT Image 1",
          "endpoint": "https://<resource>.openai.azure.com",
          "deploymentName": "gpt-image-1",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "apiKey",
            "apiKey": "sk-..."
          }
        },
        {
          "id": "gpt-image-1.5",
          "displayName": "GPT Image 1.5",
          "endpoint": "https://<resource>.openai.azure.com",
          "deploymentName": "gpt-image-1-5",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "azureCli"
          }
        }
      ]
    },
    "mai-image": {
      "enabled": true,
      "displayName": "MAI Image",
      "models": [
        {
          "id": "MAI-Image-2",
          "displayName": "MAI Image 2",
          "endpoint": "https://<resource>.services.ai.azure.com",
          "deploymentName": "MAI-Image-2",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "managedIdentity"
          }
        }
      ]
    },
    "flux-image": {
      "enabled": true,
      "displayName": "FLUX Image",
      "models": [
        {
          "id": "FLUX.2-pro",
          "displayName": "FLUX.2 Pro",
          "endpoint": "https://<resource>.services.ai.azure.com",
          "deploymentName": "FLUX-2-pro",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "apiKey",
            "apiKey": "..."
          }
        },
        {
          "id": "FLUX.2-flex",
          "displayName": "FLUX.2 Flex",
          "endpoint": "https://<resource>.services.ai.azure.com",
          "deploymentName": "FLUX-2-flex",
          "apiVersion": "2024-10-21",
          "auth": {
            "type": "apiKey",
            "apiKey": "..."
          }
        }
      ]
    },
    "tts": {
      "enabled": true,
      "displayName": "Text to Speech",
      "models": [
        {
          "id": "gpt-4o-mini-tts",
          "displayName": "GPT-4o Mini TTS",
          "endpoint": "https://<resource>.openai.azure.com",
          "deploymentName": "gpt-4o-mini-tts",
          "apiVersion": "2025-04-01-preview",
          "auth": {
            "type": "azureCli"
          }
        }
      ]
    }
  }
}
```

**Key decisions**:
- Grouped by page (model family), not by individual model — each page entry has a `models` array
- `enabled` flag at the page level controls navigation visibility
- Auth is per-model because the same page may have models in different Azure resources
- A JSON Schema file (`config.schema.json`) will be provided for IDE autocompletion and validation

---

## Provider Abstraction

`lib/providers/types.ts` defines interfaces:

```typescript
interface ImageGenerationProvider {
  generateImage(params: ImageGenerateParams): Promise<ImageResult>
  editImage?(params: ImageEditParams): Promise<ImageResult>
}

interface SpeechProvider {
  generateSpeech(params: SpeechParams): Promise<AudioResult>
}
```

Implementations:
- **`azure-openai.ts`** — Uses the `openai` npm package's `AzureOpenAI` class. Handles GPT Image models (images.generate, images.edit) and TTS (audio.speech.create).
- **`azure-foundry.ts`** — Handles MAI-Image and FLUX models. May use the `AzureOpenAI` class if endpoints are OpenAI-compatible, otherwise uses direct REST calls to the Azure AI model inference endpoint.

Factory function `getProvider(modelConfig)` returns the appropriate provider instance.

---

## Data Flow

### Image Generation

```
User fills form → clicks Generate
  │
  ▼
Client: POST /api/image/generate { modelId, prompt, params }
  │
  ▼
Server (route.ts):
  1. Load config for modelId
  2. getCredential(config.auth) → credential
  3. getProvider(config) → provider
  4. provider.generateImage({ prompt, ...params }) → Azure API
  5. Return { images[], usage, metadata }
  │
  ▼
Client: renders images in ImageGrid
  └─ Stores in local history (localStorage)
```

### Text-to-Speech

```
User enters text, selects voice/speed → clicks Generate
  │
  ▼
Client: POST /api/audio/speech { modelId, input, voice, speed, format }
  │
  ▼
Server (route.ts):
  1. Load config for modelId
  2. getCredential(config.auth) → credential
  3. provider.generateSpeech({ input, voice, speed }) → Azure TTS API
  4. Return audio stream (binary)
  │
  ▼
Client: creates Blob URL → renders in AudioPlayer
  └─ Stores metadata in local history
```

---

## Key Design Decisions

| Decision                  | Choice                     | Rationale                                                                              |
|---------------------------|----------------------------|----------------------------------------------------------------------------------------|
| Framework                 | Next.js 15 (App Router)    | Server-side API routes keep credentials secure; aligns with reference project          |
| Styling                   | Tailwind + shadcn/ui       | Lightweight, composable, no runtime CSS overhead                                       |
| Package manager           | npm                        | Included with Node.js, zero extra setup                                                |
| Config approach           | JSON file (gitignored)     | Human-readable, supports complex nested structure; env vars would be unwieldy          |
| Credentials               | Server-side only           | API routes act as authenticated proxy — credentials never reach the browser             |
| History storage           | localStorage               | Simple for single-user tool; no database setup needed                                  |
| Image return format       | b64_json                   | Azure temporary URLs expire; base64 ensures images persist in history                  |
| Pages per model family    | Separate pages             | Different families have different parameters; avoids confusing UI                       |
| Auth per model            | Per-model auth block       | Models may be in different Azure resources with different credentials                   |

---

## Error Handling

- API routes return structured errors: `{ error: { code, message, details? } }`
- Toast notifications for transient errors (network, timeout)
- Inline messages for validation errors (e.g., empty prompt)
- Azure content filter rejections displayed with specific feedback
- Network/timeout errors shown with retry option

---

## Security

- `config.json` is gitignored — never committed to version control
- API keys and tokens are only accessed server-side in API route handlers
- `GET /api/config` returns only non-sensitive fields (model IDs, display names, enabled status)
- Input sanitization on prompt text before forwarding to Azure
- Content Security Policy headers

---

## Future Extensibility

- **New providers**: The provider abstraction layer makes adding direct OpenAI, Anthropic, or local model providers straightforward — implement the interface, register in the factory
- **i18n**: Plan to use `next-intl` or similar; keep user-facing strings in locale files
- **New model types**: Video generation, speech-to-text, or other modalities follow the same pattern: new page + API route + provider implementation
