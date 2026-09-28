import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { AiProvider } from "./ai-provider.js";

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  constructor(apiKey: string, private readonly model: string) { this.client = new GoogleGenAI({ apiKey }); }
  async generateJson<T extends z.ZodType>(prompt: string, schema: T): Promise<z.infer<T>> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(schema) },
    });
    if (!response.text) throw new Error("Gemini returned no content");
    return schema.parse(JSON.parse(response.text));
  }
}
