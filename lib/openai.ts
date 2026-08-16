import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in .env.local");
}

// OpenRouter is fully OpenAI-compatible — just swap baseURL and apiKey
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // update to your domain when deployed
    "X-Title": "AI Interview Coach",
  },
});

// The model to use — set in .env.local
export const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1-0528:free";

export default openai;
