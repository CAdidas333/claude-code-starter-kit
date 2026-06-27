import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { queryModel, availableModels, getDefaultModel, type ModelId } from "./models.js";

const HOME = process.env.HOME ?? homedir();
const PROJECTS = join(HOME, "Projects");
const BRAIN = join(PROJECTS, "_brain");

// --- System prompts for different modes ---

const SYSTEM_PROMPTS: Record<string, string> = {
  collaborate: `You are a senior software architect participating in a design discussion. Another AI (Claude) is building a project and wants your perspective. Give your honest opinion — agree where the approach is sound, push back where you see problems, and suggest alternatives you think are better. Be direct and specific. Don't just validate — add value. If you'd do it differently, say so and explain why.`,

  critique: `You are a critical technical reviewer. Another AI (Claude) has proposed an approach and wants you to find the weaknesses. Your job is to stress-test the idea: find edge cases, scalability concerns, security issues, architectural flaws, and assumptions that might not hold. Be constructively harsh — the goal is to make the final design better, not to tear it down for sport. End with a clear recommendation: proceed as-is, modify (with specifics), or rethink.`,

  architecture: `You are a systems architect reviewing a design decision. Another AI (Claude) is asking for your take on an architectural choice. Consider: scalability, maintainability, performance, security, complexity vs. value, and whether simpler alternatives exist. Reference real-world patterns and tradeoffs. Give a clear recommendation with reasoning.`,

  ux_design: `You are a senior UX designer and design systems expert reviewing interface decisions made by another AI (Claude). You evaluate designs against established design principles and the project's design language when provided.

When reviewing:
1. **Visual Hierarchy** — Is there one clear focal point per level? Are primary/secondary/tertiary elements unambiguous?
2. **Typography** — Does the type scale have clear, non-overlapping steps? Are weights and sizes used consistently?
3. **Color Semantics** — Does every color have exactly one meaning? Are semantic colors (success/warning/danger) used consistently?
4. **Spacing & Layout** — Is the spacing rhythmic? Are related elements grouped tighter than unrelated ones?
5. **Accessibility** — Contrast ratios (WCAG AA minimum: 4.5:1 text, 3:1 large text/UI), touch targets (44px min), keyboard navigation, screen reader support
6. **Component Consistency** — Do similar elements look and behave the same way?
7. **Light/Dark Theme** — Do designs work in both themes? Are surface layers inverted correctly?

Be specific. Reference exact colors, sizes, and spacing values. If a design language document is provided, evaluate against those specific tokens and patterns. Don't just flag problems — propose specific CSS values or design token changes.

Format your response as:
## UX Assessment: [APPROVE / SUGGEST CHANGES / NEEDS REDESIGN]

## Findings
[numbered list with severity: CRITICAL / WARNING / SUGGESTION]

## Recommendations
[specific, actionable changes with CSS values or token references]`,

  code_review: `You are an experienced code reviewer examining changes made by another AI (Claude) on behalf of a solo developer. Review for:

1. **Correctness** — Logic bugs, off-by-ones, null handling, race conditions
2. **Security** — Injection, XSS, exposed secrets, SQL injection, auth gaps
3. **Architecture** — Does this fit well? Is it over-engineered or under-engineered?
4. **Performance** — N+1 queries, unnecessary re-renders, missing indexes, memory leaks
5. **Maintainability** — Will this be clear in 6 months? Is it testable?

Be specific. Reference line numbers or function names. Don't flag style preferences — focus on things that could cause real problems. If the code is solid, say so briefly and note any minor suggestions.

Format your response as:
## Verdict: [APPROVE / SUGGEST CHANGES / REQUEST CHANGES]

## Findings
[numbered list of findings with severity: CRITICAL / WARNING / NOTE]

## Summary
[2-3 sentence overall assessment]`,
};

// --- Helper: load project context ---

function loadProjectContext(project: string, mode?: string): string {
  const projectDir = join(PROJECTS, project);
  const contextDir = join(projectDir, "docs", "context");
  const parts: string[] = [];

  const masterPath = join(contextDir, "MASTER_CONTEXT.md");
  if (existsSync(masterPath)) {
    try {
      const content = readFileSync(masterPath, "utf-8");
      parts.push(`## Project: ${project}\n${content.slice(0, 3000)}`);
    } catch { /* skip if unreadable */ }
  }

  const activePath = join(contextDir, "ACTIVE_PROJECTS.md");
  if (existsSync(activePath)) {
    try {
      const content = readFileSync(activePath, "utf-8");
      parts.push(`## Active Work\n${content.slice(0, 2000)}`);
    } catch { /* skip */ }
  }

  // Load design language for UX-aware reviews
  const designLanguagePath = join(projectDir, "docs", "design-language.md");
  if (existsSync(designLanguagePath)) {
    try {
      const content = readFileSync(designLanguagePath, "utf-8");
      const limit = mode === "ux_design" ? 8000 : 2000;
      parts.push(`## Design Language\n${content.slice(0, limit)}`);
    } catch { /* skip */ }
  }

  return parts.join("\n\n---\n\n");
}

// --- Tool: council_consult ---

interface ConsultParams {
  question: string;
  context?: string;
  project?: string;
  mode: "collaborate" | "critique" | "architecture" | "ux_design";
  model?: ModelId;
  image_base64?: string;
  image_mime_type?: string;
}

export async function consult(params: ConsultParams): Promise<string> {
  const { question, context, project, mode, model, image_base64, image_mime_type } = params;
  const models = availableModels();

  if (models.length === 0) {
    return "ERROR: No API keys configured. Create ~/.claude/council-config.sh with COUNCIL_GOOGLE_API_KEY and/or COUNCIL_OPENAI_API_KEY.";
  }

  const targetModel = model ?? getDefaultModel();
  if (!models.includes(targetModel)) {
    return `ERROR: Model "${targetModel}" not available. Configured: ${models.join(", ")}. Check API keys in ~/.claude/council-config.sh`;
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.collaborate;

  let userPrompt = `# Question\n\n${question}`;

  if (project) {
    const projectContext = loadProjectContext(project, mode);
    if (projectContext) {
      userPrompt = `# Project Context\n\n${projectContext}\n\n---\n\n${userPrompt}`;
    }
  }

  if (context) {
    userPrompt += `\n\n# Additional Context\n\n${context}`;
  }

  const response = await queryModel(targetModel, systemPrompt, userPrompt, {
    imageBase64: image_base64,
    imageMimeType: image_mime_type,
  });

  return `## Council Response (${targetModel}, ${mode} mode)\n\n${response}`;
}

// --- Tool: council_code_review ---

interface CodeReviewParams {
  diff: string;
  project?: string;
  architecture_context?: string;
  focus?: string;
  model?: ModelId;
}

export async function codeReview(params: CodeReviewParams): Promise<string> {
  const { diff, project, architecture_context, focus, model } = params;
  const models = availableModels();

  if (models.length === 0) {
    return "ERROR: No API keys configured. Create ~/.claude/council-config.sh with COUNCIL_GOOGLE_API_KEY and/or COUNCIL_OPENAI_API_KEY.";
  }

  const targetModel = model ?? getDefaultModel();
  if (!models.includes(targetModel)) {
    return `ERROR: Model "${targetModel}" not available. Configured: ${models.join(", ")}. Check API keys in ~/.claude/council-config.sh`;
  }

  let userPrompt = `# Code Changes to Review\n\n\`\`\`diff\n${diff}\n\`\`\``;

  if (project) {
    const projectContext = loadProjectContext(project);
    if (projectContext) {
      userPrompt = `# Project Context\n\n${projectContext}\n\n---\n\n${userPrompt}`;
    }
  }

  if (architecture_context) {
    userPrompt += `\n\n# Architecture Context\n\n${architecture_context}`;
  }

  if (focus) {
    userPrompt += `\n\n# Review Focus\n\nPay special attention to: ${focus}`;
  }

  const response = await queryModel(targetModel, SYSTEM_PROMPTS.code_review, userPrompt);

  return `## Council Code Review (${targetModel})\n\n${response}`;
}

// --- Tool: council_save ---

interface SaveParams {
  project: string;
  content: string;
  source_model: string;
  review_type: "consultation" | "code_review";
}

export async function saveReview(params: SaveParams): Promise<string> {
  const { project, content, source_model, review_type } = params;
  const projectDir = join(PROJECTS, project);
  const contextDir = join(projectDir, "docs", "context");

  if (!existsSync(contextDir)) {
    return `ERROR: Project context directory not found: ${contextDir}`;
  }

  const reviewDir = join(contextDir, "council-reviews");
  if (!existsSync(reviewDir)) {
    mkdirSync(reviewDir, { recursive: true });
  }

  const date = new Date().toISOString().split("T")[0];
  const existing = readdirSync(reviewDir).filter(f => f.startsWith(date));
  const seq = existing.length + 1;
  const filename = `${date}_${review_type}_${seq}.md`;
  const filepath = join(reviewDir, filename);

  const doc = `---
date: ${date}
source_model: ${source_model}
review_type: ${review_type}
project: ${project}
---

${content}
`;

  writeFileSync(filepath, doc, "utf-8");

  // Also update/create PEER_REVIEWS.md as a latest-review pointer
  const peerReviewPath = join(contextDir, "PEER_REVIEWS.md");
  const header = `---
last_updated: ${date}
---

# Council Peer Reviews — ${project}

Latest review from an external model. Read this at session start to see what was flagged.

---

## Latest (${date}, ${source_model}, ${review_type})

${content}
`;

  writeFileSync(peerReviewPath, header, "utf-8");

  return `Review saved:\n- ${filepath}\n- ${peerReviewPath} (latest pointer updated)`;
}

// --- Tool: council_status ---

export async function status(): Promise<string> {
  const models = availableModels();
  const defaultModel = getDefaultModel();

  const lines: string[] = [
    "## Council Status",
    "",
    `**Available models:** ${models.length > 0 ? models.join(", ") : "NONE — configure API keys in ~/.claude/council-config.sh"}`,
    `**Default model:** ${defaultModel}`,
    "",
    "**Modes:**",
    "- `collaborate` — Peer discussion, back-and-forth design",
    "- `critique` — Stress-test an idea, find weaknesses",
    "- `architecture` — Systems design review",
    "- `ux_design` — UX/design system review with optional screenshot analysis",
    "- `code_review` — Structured QA on code changes",
    "",
  ];

  // Check for saved reviews across projects (scan ~/Projects dynamically)
  const projectDirs = existsSync(PROJECTS)
    ? readdirSync(PROJECTS, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
        .map(d => d.name)
    : [];
  const reviewCounts: string[] = [];

  for (const p of projectDirs) {
    const reviewDir = join(PROJECTS, p, "docs", "context", "council-reviews");
    if (existsSync(reviewDir)) {
      const files = readdirSync(reviewDir).filter(f => f.endsWith(".md"));
      if (files.length > 0) {
        reviewCounts.push(`- **${p}:** ${files.length} review(s)`);
      }
    }
  }

  if (reviewCounts.length > 0) {
    lines.push("**Saved reviews:**");
    lines.push(...reviewCounts);
  } else {
    lines.push("**Saved reviews:** None yet");
  }

  return lines.join("\n");
}
