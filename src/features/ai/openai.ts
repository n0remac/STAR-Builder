import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

const DEFAULT_MODEL = "gpt-5.4-mini";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function parseStructuredResponse<TSchema extends z.ZodTypeAny>({
  name,
  schema,
  system,
  user
}: {
  name: string;
  schema: TSchema;
  system: string;
  user: unknown;
}): Promise<z.infer<TSchema>> {
  const openai = getClient();

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.responses.parse({
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    input: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: JSON.stringify(user)
      }
    ],
    text: {
      format: zodTextFormat(schema, name)
    }
  });

  if (!response.output_parsed) {
    throw new Error(`OpenAI did not return parsed output for ${name}.`);
  }

  return response.output_parsed;
}
