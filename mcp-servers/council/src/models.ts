import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const HOME = process.env.HOME ?? homedir();
const CONFIG_PATH = join(HOME, ".claude", "council-config.sh");

interface CouncilConfig {
  googleApiKey?: string;
  openaiApiKey?: string;
  nvidiaApiKey?: string;
  defaultModel: "gemini" | "gpt";
}

function loadConfig(): CouncilConfig {
  const config: CouncilConfig = { defaultModel: "gemini" };
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const googleMatch = raw.match(/COUNCIL_GOOGLE_API_KEY="([^"]+)"/);
    const openaiMatch = raw.match(/COUNCIL_OPENAI_API_KEY="([^"]+)"/);
    const nvidiaMatch = raw.match(/COUNCIL_NVIDIA_API_KEY="([^"]+)"/);
    const defaultMatch = raw.match(/COUNCIL_DEFAULT_MODEL="([^"]+)"/);
    if (googleMatch) config.googleApiKey = googleMatch[1];
    if (openaiMatch) config.openaiApiKey = openaiMatch[1];
    if (nvidiaMatch) config.nvidiaApiKey = nvidiaMatch[1];
    if (defaultMatch) config.defaultModel = defaultMatch[1] as "gemini" | "gpt";
  } catch {
    // Config file doesn't exist yet — that's fine, tools will report which keys are missing
  }
  return config;
}

const config = loadConfig();

let gemini: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;
let nvidia: OpenAI | null = null;

if (config.googleApiKey) {
  gemini = new GoogleGenerativeAI(config.googleApiKey);
}
if (config.openaiApiKey) {
  openai = new OpenAI({ apiKey: config.openaiApiKey });
}
if (config.nvidiaApiKey) {
  nvidia = new OpenAI({ apiKey: config.nvidiaApiKey, baseURL: "https://integrate.api.nvidia.com/v1" });
}

export type ModelId = "gemini" | "gpt" | "nvidia";

export function getDefaultModel(): ModelId {
  return config.defaultModel;
}

export function availableModels(): ModelId[] {
  const models: ModelId[] = [];
  if (gemini) models.push("gemini");
  if (openai) models.push("gpt");
  if (nvidia) models.push("nvidia");
  return models;
}

export interface QueryOptions {
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
}

export async function queryModel(
  model: ModelId,
  systemPrompt: string,
  userPrompt: string,
  options?: QueryOptions
): Promise<string> {
  if (model === "gemini") {
    if (!gemini) {
      return "ERROR: Google API key not configured. Add COUNCIL_GOOGLE_API_KEY to ~/.claude/council-config.sh";
    }
    try {
      const m = gemini.getGenerativeModel({ model: "gemini-3.5-flash" });
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: userPrompt }
      ];
      if (options?.imageBase64 && options?.imageMimeType) {
        parts.push({
          inlineData: {
            mimeType: options.imageMimeType,
            data: options.imageBase64,
          }
        });
      }
      const result = await m.generateContent({
        contents: [{ role: "user", parts }],
        systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
        generationConfig: options?.temperature ? { temperature: options.temperature } : undefined,
      });
      return result.response.text();
    } catch (err: any) {
      return `ERROR from Gemini: ${err.message ?? err}`;
    }
  }

  if (model === "gpt") {
    if (!openai) {
      return "ERROR: OpenAI API key not configured. Add COUNCIL_OPENAI_API_KEY to ~/.claude/council-config.sh";
    }
    try {
      const result = await openai.chat.completions.create({
        model: "gpt-5.4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 4096,
      });
      return result.choices[0]?.message?.content || "No response from GPT (empty content returned).";
    } catch (err: any) {
      return `ERROR from GPT: ${err.message ?? err}`;
    }
  }

  if (model === "nvidia") {
    if (!nvidia) {
      return "ERROR: NVIDIA API key not configured. Add COUNCIL_NVIDIA_API_KEY to ~/.claude/council-config.sh";
    }
    try {
      const result = await nvidia.chat.completions.create({
        model: "deepseek-ai/deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
      });
      return result.choices[0]?.message?.content || "No response from NVIDIA/DeepSeek (empty content returned).";
    } catch (err: any) {
      return `ERROR from NVIDIA (DeepSeek): ${err.message ?? err}`;
    }
  }

  return `ERROR: Unknown model "${model}". Use "gemini", "gpt", or "nvidia".`;
}
