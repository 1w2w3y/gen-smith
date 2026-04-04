# gen-smith

A lightweight playground for generative AI models — connect to Azure AI Foundry and experiment with image generation and text-to-speech through an intuitive web UI.

## Features

- **GPT Image playground** — Generate images with gpt-image-1.5, gpt-image-1, and gpt-image-1-mini with full parameter control (size, quality, background, format, moderation)
- **FLUX Image playground** — Generate images with FLUX.2-pro and FLUX.2-flex via Azure AI Foundry serverless endpoints
- **Text-to-Speech playground** — Convert text to speech with gpt-4o-mini-tts, 6 voice options, speed control, and style instructions
- **Two-column layout** — Configuration form on the left, output on the right
- **Multi-image grid** — Generate up to 4 images at once with grid view, thumbnail carousel, and single-image zoom
- **Flexible authentication** — API key, Azure CLI token (Entra ID), and managed identity support per model
- **JSON-based configuration** — Only configured and enabled models appear in the UI
- **Light and dark theme** — Elegant light theme by default with soft indigo accents, dark theme toggle included
- **Bilingual UI** — English and Chinese with automatic browser language detection
- **Download** — Save generated images (PNG/JPEG/WebP) and audio files (MP3/OPUS/AAC/FLAC/WAV)

## Screenshots

### GPT Image Playground

![GPT Image Playground](docs/screenshots/gpt-image.png)

### FLUX Image Playground

![FLUX Image Playground](docs/screenshots/flux-image.png)

### Text to Speech Playground

![Text to Speech Playground](docs/screenshots/tts.png)

## Supported Models

| Category  | Page       | Models                                        | API Type                     |
|-----------|------------|-----------------------------------------------|------------------------------|
| Image Gen | GPT Image  | gpt-image-1.5, gpt-image-1, gpt-image-1-mini | OpenAI SDK (images/generations) |
| Image Gen | FLUX Image | FLUX.2-pro, FLUX.2-flex                       | Azure AI Foundry serverless  |
| Audio Gen | TTS        | gpt-4o-mini-tts                               | Azure Cognitive Services     |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm (included with Node.js)
- An Azure AI Foundry resource with one or more deployed models

### Installation

```bash
git clone https://github.com/1w2w3y/gen-smith.git
cd gen-smith
npm install
```

### Configuration

Copy the example config and fill in your model endpoints and credentials:

```bash
cp config.example.json config.json
```

Edit `config.json` with your Azure deployment details. Set `"enabled": false` or remove models to hide them from the UI.

**API Key authentication:**

```json
{
  "auth": {
    "type": "apiKey",
    "apiKey": "your-api-key"
  }
}
```

**Azure CLI authentication (recommended for development):**

```json
{
  "auth": {
    "type": "azureCli"
  }
}
```

Make sure you're logged in with `az login` before starting the dev server.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm test
```

## Project Structure

```
src/
  app/
    image/gpt/        GPT Image playground page
    image/flux/        FLUX Image playground page
    audio/tts/         Text-to-Speech playground page
    api/
      image/generate/  GPT Image API route (OpenAI SDK)
      image/flux/      FLUX Image API route (direct REST)
      audio/tts/       TTS API route (direct REST)
      config/          Sanitized config endpoint
  components/
    image/             GenerationForm, FluxGenerationForm, ImageOutput
    audio/             TTSForm, AudioOutput
    layout/            Navbar, ThemeProvider, LanguageProvider
    ui/                shadcn/ui primitives
  hooks/               useGenerateImage, useGenerateFluxImage, useGenerateSpeech
  lib/                 config loader, auth helper, utilities
  types/               TypeScript type definitions
config.example.json    Template configuration (committed)
config.json            Your configuration with secrets (gitignored)
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- [OpenAI Node SDK](https://github.com/openai/openai-node) for GPT Image models
- [@azure/identity](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity) for Entra ID / Azure CLI authentication
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for testing

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Technical Design](docs/DESIGN.md)

## License

[MIT](LICENSE)
