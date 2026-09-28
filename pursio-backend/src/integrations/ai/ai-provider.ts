import type { z } from "zod";
export interface AiProvider {
  generateJson<T extends z.ZodType>(prompt: string, schema: T): Promise<z.infer<T>>;
}
