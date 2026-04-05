const en = {
  // Nav
  "nav.gptImage": "GPT Image",
  "nav.fluxImage": "FLUX Image",
  "nav.tts": "TTS",
  "nav.toggleTheme": "Toggle theme",
  "nav.toggleLang": "中文",

  // Home
  "home.title": "gen-smith",
  "home.subtitle": "Playground for generative AI models on Azure AI Foundry",
  "home.gptImage.title": "GPT Image",
  "home.gptImage.desc": "Generate images with GPT Image models",
  "home.fluxImage.title": "FLUX Image",
  "home.fluxImage.desc": "Generate images with FLUX models",
  "home.tts.title": "Text to Speech",
  "home.tts.desc": "Convert text to natural-sounding speech",
  "home.noModels": "No models configured. Set GEN_SMITH_* environment variables or provide a config.json to get started.",

  // Common
  "common.model": "Model",
  "common.selectModel": "Select a model",
  "common.prompt": "Prompt",
  "common.promptPlaceholder": "Describe the image you want to generate...",
  "common.numImages": "Number of images",
  "common.generate": "Generate",
  "common.generating": "Generating...",
  "common.error": "Error",
  "common.configError": "Configuration Error",
  "common.loading": "Loading configuration...",
  "common.download": "Download",

  // GPT Image
  "gptImage.title": "Image Generation",
  "gptImage.desc": "Configure parameters and generate images",
  "gptImage.configError": "No GPT Image models configured. Set GEN_SMITH_GPT_IMAGE_ENDPOINT or add models to config.json.",
  "gptImage.size": "Size",
  "gptImage.size.auto": "Auto",
  "gptImage.size.square": "1024x1024 (Square)",
  "gptImage.size.landscape": "1536x1024 (Landscape)",
  "gptImage.size.portrait": "1024x1536 (Portrait)",
  "gptImage.quality": "Quality",
  "gptImage.quality.auto": "Auto",
  "gptImage.quality.low": "Low",
  "gptImage.quality.medium": "Medium",
  "gptImage.quality.high": "High",
  "gptImage.background": "Background",
  "gptImage.background.auto": "Auto",
  "gptImage.background.opaque": "Opaque",
  "gptImage.background.transparent": "Transparent",
  "gptImage.outputFormat": "Output Format",
  "gptImage.compression": "Compression",
  "gptImage.moderation": "Moderation",
  "gptImage.moderation.auto": "Auto",
  "gptImage.moderation.low": "Low",

  // FLUX
  "flux.title": "FLUX Image Generation",
  "flux.desc": "Configure parameters and generate images with FLUX models",
  "flux.configError": "No FLUX Image models configured. Set GEN_SMITH_FLUX_IMAGE_ENDPOINT or add models to config.json.",
  "flux.dimensions": "Dimensions",
  "flux.dim.square": "1024x1024 (Square)",
  "flux.dim.landscape": "1536x1024 (Landscape)",
  "flux.dim.portrait": "1024x1536 (Portrait)",
  "flux.dim.small": "768x768 (Small)",

  // TTS
  "tts.title": "Text to Speech",
  "tts.desc": "Convert text to natural-sounding speech",
  "tts.configError": "No TTS models configured. Set GEN_SMITH_TTS_ENDPOINT or add models to config.json.",
  "tts.text": "Text",
  "tts.textPlaceholder": "Enter the text you want to convert to speech...",
  "tts.voice": "Voice",
  "tts.speed": "Speed",
  "tts.format": "Format",
  "tts.instructions": "Instructions (optional)",
  "tts.instructionsPlaceholder": "e.g., Speak in a cheerful and friendly tone...",
  "tts.generateSpeech": "Generate Speech",

  // Image Output
  "imageOutput.loading": "Generating image...",
  "imageOutput.empty": "Generated images will appear here",

  // Audio Output
  "audioOutput.loading": "Generating speech...",
  "audioOutput.empty": "Generated audio will appear here",

  // History
  "history.title": "History",
  "history.output": "Output",
  "history.empty": "No generation history yet",
  "history.clearAll": "Clear all",
  "history.clearConfirm": "Are you sure you want to clear all history?",
  "history.restore": "Restore",
  "history.images": "images",
  "history.viewImages": "View images",
  "history.ago.justNow": "just now",
  "history.ago.minutes": "{n}m ago",
  "history.ago.hours": "{n}h ago",
  "history.ago.days": "{n}d ago",
} as const;

export default en;
