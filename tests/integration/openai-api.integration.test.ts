import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";

import { parseStructuredResponse } from "@/features/ai/openai";

type ResponsesRequest = {
  input?: Array<{
    content?: string;
    role?: string;
  }>;
  model?: string;
  text?: {
    format?: {
      name?: string;
      schema?: unknown;
      strict?: boolean;
      type?: string;
    };
  };
};

let authorizationHeader: string | null = null;
let requestBody: ResponsesRequest | null = null;

const server = setupServer(
  http.post("https://api.openai.com/v1/responses", async ({ request }) => {
    authorizationHeader = request.headers.get("authorization");
    requestBody = (await request.json()) as ResponsesRequest;

    return HttpResponse.json({
      id: "resp_msw_test",
      object: "response",
      created_at: 0,
      status: "completed",
      model: "msw-test-model",
      error: null,
      incomplete_details: null,
      output: [
        {
          id: "msg_msw_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              annotations: [],
              text: JSON.stringify({
                summary: "Built reliable platform systems."
              })
            }
          ]
        }
      ]
    });
  })
);

describe("OpenAI Responses API adapter", () => {
  beforeAll(() => {
    vi.stubEnv("OPENAI_API_KEY", "msw-test-key");
    vi.stubEnv("OPENAI_MODEL", "msw-test-model");
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    authorizationHeader = null;
    requestBody = null;
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    vi.unstubAllEnvs();
  });

  it("sends a structured request and parses the mocked response", async () => {
    const result = await parseStructuredResponse({
      name: "profile_summary_test",
      schema: z.object({
        summary: z.string()
      }),
      system: "Summarize the supplied career evidence.",
      user: {
        career: "Platform engineering"
      }
    });

    expect(result).toEqual({
      summary: "Built reliable platform systems."
    });
    expect(authorizationHeader).toBe("Bearer msw-test-key");
    expect(requestBody).toMatchObject({
      model: "msw-test-model",
      input: [
        {
          role: "system",
          content: "Summarize the supplied career evidence."
        },
        {
          role: "user",
          content: JSON.stringify({ career: "Platform engineering" })
        }
      ],
      text: {
        format: {
          name: "profile_summary_test",
          strict: true,
          type: "json_schema"
        }
      }
    });
    expect(requestBody?.text?.format?.schema).toMatchObject({
      additionalProperties: false,
      properties: {
        summary: {
          type: "string"
        }
      },
      required: ["summary"],
      type: "object"
    });
  });
});
