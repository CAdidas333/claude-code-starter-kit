import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { consult, codeReview, saveReview, status } from "./tools.js";
import { generateDesignImage } from "./design.js";

const server = new McpServer({
  name: "council",
  version: "1.0.0",
});

// --- council_consult ---
server.tool(
  "council_consult",
  "Get a second opinion from another AI model (Gemini or GPT). Use for architecture decisions, design debates, or when you want a different perspective on an approach. The other model acts as a collaborator, critic, or architect — not a yes-man.",
  {
    question: z.string().describe("The question, plan, or idea to get a second opinion on"),
    context: z.string().optional().describe("Additional context — code snippets, constraints, prior decisions"),
    project: z.string().optional().describe("Project name (e.g., my-app) — auto-loads project context"),
    mode: z.enum(["collaborate", "critique", "architecture", "ux_design"]).default("collaborate").describe("collaborate = peer discussion, critique = stress-test/find weaknesses, architecture = systems design review, ux_design = UX/design system review with accessibility focus"),
    model: z.enum(["gemini", "gpt", "nvidia"]).optional().describe("Which model to consult. Defaults to configured default."),
    image_base64: z.string().optional().describe("Base64-encoded screenshot or design image for visual review (Gemini vision). Best with ux_design mode."),
    image_mime_type: z.string().optional().describe("MIME type of the image (image/png, image/jpeg, image/webp). Required if image_base64 is provided."),
  },
  async ({ question, context, project, mode, model, image_base64, image_mime_type }) => {
    const result = await consult({
      question,
      context: context ?? undefined,
      project: project ?? undefined,
      mode,
      model: model as "gemini" | "gpt" | undefined,
      image_base64: image_base64 ?? undefined,
      image_mime_type: image_mime_type ?? undefined,
    });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// --- council_code_review ---
server.tool(
  "council_code_review",
  "Send code changes to another AI model for QA review. Returns structured findings with severity levels. Use at end of session or before major commits for an external perspective on what was built.",
  {
    diff: z.string().describe("The code diff or code snippet to review"),
    project: z.string().optional().describe("Project name — auto-loads architecture context"),
    architecture_context: z.string().optional().describe("Additional architecture context if project auto-load isn't enough"),
    focus: z.string().optional().describe("Specific concerns to focus on (e.g., 'SQL injection', 'React performance', 'auth flow')"),
    model: z.enum(["gemini", "gpt", "nvidia"]).optional().describe("Which model to use for review. Defaults to configured default."),
  },
  async ({ diff, project, architecture_context, focus, model }) => {
    const result = await codeReview({
      diff,
      project: project ?? undefined,
      architecture_context: architecture_context ?? undefined,
      focus: focus ?? undefined,
      model: model as "gemini" | "gpt" | undefined,
    });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// --- council_save ---
server.tool(
  "council_save",
  "Save a council review or consultation result to the project's context docs. Persists to docs/context/council-reviews/ and updates PEER_REVIEWS.md so the next session picks it up automatically.",
  {
    project: z.string().describe("Project name (e.g., my-app)"),
    content: z.string().describe("The review or consultation content to save"),
    source_model: z.string().describe("Which model produced this review (gemini, gpt)"),
    review_type: z.enum(["consultation", "code_review"]).describe("Type of review"),
  },
  async ({ project, content, source_model, review_type }) => {
    const result = await saveReview({ project, content, source_model, review_type });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// --- council_status ---
server.tool(
  "council_status",
  "Check Council status — which models are available, what modes exist, and how many saved reviews exist per project.",
  {},
  async () => {
    const result = await status();
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// --- council_design_generate ---
server.tool(
  "council_design_generate",
  "Generate a design image using DALL-E 3 or Gemini. Use for UI mockups, component designs, color palette visualizations, icons, or design concept exploration. Returns a file path that Claude can read with the Read tool.",
  {
    prompt: z.string().describe("Detailed description of the image to generate. Include specific colors (hex values), layout, typography, and design system references."),
    provider: z.enum(["dalle", "gemini"]).default("dalle").describe("Image generation provider. dalle = DALL-E 3 (reliable, high quality), gemini = Gemini (experimental, UI-aware)"),
    project: z.string().optional().describe("Project name for filename organization"),
    size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).default("1024x1024").describe("Image dimensions. 1792x1024 = landscape, 1024x1792 = portrait"),
    style: z.enum(["vivid", "natural"]).default("natural").describe("DALL-E only: vivid = dramatic/hyper-real, natural = more realistic"),
    quality: z.string().default("hd").describe("Quality level: hd/standard for DALL-E"),
    label: z.string().optional().describe("Human-readable label for the filename (e.g., 'severity-badges', 'dashboard-layout')"),
  },
  async ({ prompt, provider, project, size, style, quality, label }) => {
    const result = await generateDesignImage({
      prompt,
      provider: provider as "dalle" | "gemini",
      project: project ?? undefined,
      size,
      style,
      quality,
      label: label ?? undefined,
    });

    let text: string;
    if (result.success) {
      text = `## Image Generated (${result.provider})\n\n**File:** ${result.filepath}\n\nUse the Read tool to view this image.`;
      if (result.revised_prompt) {
        text += `\n\n**Revised prompt (DALL-E):** ${result.revised_prompt}`;
      }
    } else {
      text = `## Image Generation Failed (${result.provider})\n\n**Error:** ${result.error}`;
    }

    return { content: [{ type: "text" as const, text }] };
  }
);

// --- council_design_review ---
server.tool(
  "council_design_review",
  "Send a screenshot or design image to Gemini for visual UX review. Automatically loads the project's design-language.md for design-system-aware feedback. Accepts a file path to an image on disk.",
  {
    image_path: z.string().describe("Absolute path to the image file to review (PNG, JPG, or WebP)"),
    question: z.string().default("Review this UI design for visual hierarchy, typography, color usage, spacing, and accessibility. Identify any issues and suggest specific improvements.").describe("What to focus on in the review"),
    project: z.string().optional().describe("Project name (e.g., my-app) — auto-loads design language and project context"),
    model: z.enum(["gemini", "gpt"]).default("gemini").describe("Model to use. Gemini recommended for vision."),
  },
  async ({ image_path, question, project, model }) => {
    let imageBase64: string;
    let mimeType: string;
    try {
      const buffer = readFileSync(image_path);
      imageBase64 = buffer.toString("base64");
      const ext = image_path.split(".").pop()?.toLowerCase();
      mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
               : ext === "webp" ? "image/webp"
               : "image/png";
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `ERROR: Could not read image at ${image_path}: ${err.message}` }] };
    }

    const result = await consult({
      question,
      project: project ?? undefined,
      mode: "ux_design",
      model: model as "gemini" | "gpt",
      image_base64: imageBase64,
      image_mime_type: mimeType,
    });

    return { content: [{ type: "text" as const, text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Council MCP server error:", err);
  process.exit(1);
});
