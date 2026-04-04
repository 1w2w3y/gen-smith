# gen-smith

A lightweight playground for generative AI models — connect to Azure AI Foundry and experiment with image generation and audio synthesis through an intuitive web UI.

## Features

- **Multi-model image generation** — GPT Image, MAI Image, and FLUX families, each with dedicated playground pages
- **Text-to-speech** — Generate audio with gpt-4o-mini-tts, including voice and style controls
- **Two-column playground layout** — Configuration form on the left, output on the right
- **Image editing and inpainting** — Canvas-based mask editor for targeted edits
- **Generation history** — Track past generations with metadata and thumbnails
- **Flexible authentication** — API key, Azure CLI token (Entra ID), and managed identity
- **JSON-based configuration** — Only configured models appear in the UI
- **Light and dark theme**
- **Download** — Save individual images or batch download all results

## Supported Models

| Category   | Page       | Models                                       |
|------------|------------|----------------------------------------------|
| Image Gen  | GPT Image  | gpt-image-1.5, gpt-image-1, gpt-image-1-mini |
| Image Gen  | MAI Image  | MAI-Image-2                                  |
| Image Gen  | FLUX Image | FLUX.2-pro, FLUX.2-flex                      |
| Audio Gen  | TTS        | gpt-4o-mini-tts                              |

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

Edit `config.json` with your Azure deployment details. Models that are not configured will be hidden from the UI. See the [design doc](docs/DESIGN.md#configuration-schema) for the full schema reference.

Minimal example with one model configured:

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
            "apiKey": "your-api-key"
          }
        }
      ]
    }
  }
}
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- [OpenAI Node SDK](https://github.com/openai/openai-node) (`AzureOpenAI` client)
- [@azure/identity](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity) for Entra ID authentication

## License

[MIT](LICENSE)
