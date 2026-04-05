const zh = {
  // Nav
  "nav.gptImage": "GPT 图像",
  "nav.fluxImage": "FLUX 图像",
  "nav.tts": "语音合成",
  "nav.toggleTheme": "切换主题",
  "nav.toggleLang": "EN",

  // Home
  "home.title": "gen-smith",
  "home.subtitle": "Azure AI Foundry 生成式 AI 模型试验场",
  "home.gptImage.title": "GPT 图像",
  "home.gptImage.desc": "使用 GPT Image 模型生成图像",
  "home.fluxImage.title": "FLUX 图像",
  "home.fluxImage.desc": "使用 FLUX 模型生成图像",
  "home.tts.title": "语音合成",
  "home.tts.desc": "将文本转换为自然语音",

  // Common
  "common.model": "模型",
  "common.selectModel": "选择模型",
  "common.prompt": "提示词",
  "common.promptPlaceholder": "描述你想生成的图像...",
  "common.numImages": "图像数量",
  "common.generate": "生成",
  "common.generating": "生成中...",
  "common.error": "错误",
  "common.configError": "配置错误",
  "common.loading": "正在加载配置...",
  "common.download": "下载",

  // GPT Image
  "gptImage.title": "图像生成",
  "gptImage.desc": "配置参数并生成图像",
  "gptImage.configError": "未配置 GPT Image 模型，请在 config.json 中添加。",
  "gptImage.size": "尺寸",
  "gptImage.size.auto": "自动",
  "gptImage.size.square": "1024x1024 (正方形)",
  "gptImage.size.landscape": "1536x1024 (横向)",
  "gptImage.size.portrait": "1024x1536 (纵向)",
  "gptImage.quality": "质量",
  "gptImage.quality.auto": "自动",
  "gptImage.quality.low": "低",
  "gptImage.quality.medium": "中",
  "gptImage.quality.high": "高",
  "gptImage.background": "背景",
  "gptImage.background.auto": "自动",
  "gptImage.background.opaque": "不透明",
  "gptImage.background.transparent": "透明",
  "gptImage.outputFormat": "输出格式",
  "gptImage.compression": "压缩",
  "gptImage.moderation": "内容审核",
  "gptImage.moderation.auto": "自动",
  "gptImage.moderation.low": "低",

  // FLUX
  "flux.title": "FLUX 图像生成",
  "flux.desc": "配置参数并使用 FLUX 模型生成图像",
  "flux.configError": "未配置 FLUX Image 模型，请在 config.json 中添加。",
  "flux.dimensions": "尺寸",
  "flux.dim.square": "1024x1024 (正方形)",
  "flux.dim.landscape": "1536x1024 (横向)",
  "flux.dim.portrait": "1024x1536 (纵向)",
  "flux.dim.small": "768x768 (小尺寸)",

  // TTS
  "tts.title": "语音合成",
  "tts.desc": "将文本转换为自然语音",
  "tts.configError": "未配置 TTS 模型，请在 config.json 中添加。",
  "tts.text": "文本",
  "tts.textPlaceholder": "输入要转换为语音的文本...",
  "tts.voice": "声音",
  "tts.speed": "速度",
  "tts.format": "格式",
  "tts.instructions": "指令（可选）",
  "tts.instructionsPlaceholder": "例如：用欢快友好的语气说话...",
  "tts.generateSpeech": "生成语音",

  // Image Output
  "imageOutput.loading": "正在生成图像...",
  "imageOutput.empty": "生成的图像将显示在这里",

  // Audio Output
  "audioOutput.loading": "正在生成语音...",
  "audioOutput.empty": "生成的音频将显示在这里",

  // History
  "history.title": "历史记录",
  "history.output": "输出",
  "history.empty": "暂无生成历史",
  "history.clearAll": "清除全部",
  "history.clearConfirm": "确定要清除所有历史记录吗？",
  "history.restore": "恢复",
  "history.images": "张图片",
  "history.viewImages": "查看图片",
  "history.ago.justNow": "刚刚",
  "history.ago.minutes": "{n}分钟前",
  "history.ago.hours": "{n}小时前",
  "history.ago.days": "{n}天前",
} as const;

export default zh;
