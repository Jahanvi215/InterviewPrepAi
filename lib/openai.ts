import OpenAI from "openai";

// OpenRouter is fully OpenAI-compatible — just swap baseURL and apiKey
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "missing-key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI Interview Coach",
  },
});

export const MODEL =
  process.env.OPENROUTER_MODEL ?? "openrouter/free";

export default openai;
