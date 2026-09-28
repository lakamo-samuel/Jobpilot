import type { Config } from "../../config/env.js";
import type { AiProvider } from "./ai-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
export function createAiProvider(config: Config): AiProvider | undefined {
  return config.GEMINI_API_KEY ? new GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL) : undefined;
}
