import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const HOME = process.env.HOME ?? homedir();
const CONFIG_PATH = join(HOME, ".claude", "council-config.sh");
const OUTPUT_DIR = "/tmp/council-design";

function loadKeys(): { googleKey?: string; openaiKey?: string } {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const gMatch = raw.match(/COUNCIL_GOOGLE_API_KEY="([^"]+)"/);
    const oMatch = raw.match(/COUNCIL_OPENAI_API_KEY="([^"]+)"/);
    return { googleKey: gMatch?.[1], openaiKey: oMatch?.[1] };
  } catch {
    return {};
  }
}

const keys = loadKeys();

let genai: GoogleGenAI | null = null;
if (keys.googleKey) {
  genai = new GoogleGenAI({ apiKey: keys.googleKey });
}

let openai: OpenAI | null = null;
if (keys.openaiKey) {
  openai = new OpenAI({ apiKey: keys.openaiKey });
}

export type ImageProvider = "dalle" | "gemini";

export interface GenerateImageParams {
  prompt: string;
  provider?: ImageProvider;
  project?: string;
  size?: string;
  style?: string;
  quality?: string;
  label?: string;
}

export interface GenerateImageResult {
  success: boolean;
  filepath?: string;
  provider: string;
  error?: string;
  revised_prompt?: string;
}

function saveImage(base64Data: string, project?: string, label?: string, ext: string = "png"): string {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const date = new Date().toISOString().split("T")[0];
  const projectSlug = project ? `${project.replace(/[^a-zA-Z0-9-]/g, "_")}_` : "";
  const labelSlug = label ? `${label.replace(/[^a-zA-Z0-9-]/g, "_")}_` : "";
  const seq = Date.now() % 100000;
  const filename = `${projectSlug}${labelSlug}${date}_${seq}.${ext}`;
  const filepath = join(OUTPUT_DIR, filename); // nosemgrep: path-join-resolve-traversal

  if (!filepath.startsWith(OUTPUT_DIR)) {
    throw new Error("Path traversal blocked");
  }

  writeFileSync(filepath, Buffer.from(base64Data, "base64"));
  return filepath;
}

async function generateWithDalle(params: GenerateImageParams): Promise<GenerateImageResult> {
  if (!openai) {
    return { success: false, provider: "dalle", error: "OpenAI API key not configured. Add COUNCIL_OPENAI_API_KEY to ~/.claude/council-config.sh" };
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: params.prompt,
      n: 1,
      size: (params.size as "1024x1024" | "1792x1024" | "1024x1792") || "1024x1024",
      style: (params.style as "vivid" | "natural") || "natural",
      quality: (params.quality as "standard" | "hd") || "hd",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      return { success: false, provider: "dalle", error: "No image data returned from DALL-E" };
    }

    const filepath = saveImage(imageData, params.project, params.label, "png");
    return {
      success: true,
      filepath,
      provider: "dalle",
      revised_prompt: response.data?.[0]?.revised_prompt ?? undefined,
    };
  } catch (err: any) {
    return { success: false, provider: "dalle", error: `DALL-E error: ${err.message ?? err}` };
  }
}

async function generateWithGemini(params: GenerateImageParams): Promise<GenerateImageResult> {
  if (!genai) {
    return { success: false, provider: "gemini", error: "Google API key not configured. Add COUNCIL_GOOGLE_API_KEY to ~/.claude/council-config.sh" };
  }

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Look for image parts in response
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if ((part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          const ext = inlineData.mimeType?.includes("png") ? "png" : "png";
          const filepath = saveImage(inlineData.data, params.project, params.label, ext);
          return { success: true, filepath, provider: "gemini" };
        }
      }
    }

    return { success: false, provider: "gemini", error: "No image in Gemini response. The model may not support image generation with your current API key/plan." };
  } catch (err: any) {
    return { success: false, provider: "gemini", error: `Gemini image error: ${err.message ?? err}` };
  }
}

export async function generateDesignImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const provider = params.provider ?? "dalle";
  if (provider === "gemini") return generateWithGemini(params);
  return generateWithDalle(params);
}
