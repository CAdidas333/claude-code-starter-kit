import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchNotes, getBriefing, getStats, getCheatsheet, readMessages, sendMessage } from "./tools.js";

const server = new McpServer({
  name: "armory",
  version: "1.0.0",
});

// --- armory_search ---
server.tool(
  "armory_search",
  "Search The Armory knowledge vault by keyword, tag, or category. Returns matching notes with TL;DR and relevance info.",
  {
    query: z.string().describe("Search query — matches against title, tags, content, TL;DR"),
    category: z.string().optional().describe("Filter by category: ai-coding, prompt-engineering, mcp, claude-code, workflow, tools, devops, design, business, other"),
    tags: z.array(z.string()).optional().describe("Filter by tags (matches any)"),
    limit: z.number().optional().default(10).describe("Max results to return"),
  },
  async ({ query, category, tags, limit }) => {
    const results = await searchNotes({ query, category, tags, limit: limit ?? 10 });
    return {
      content: [{ type: "text" as const, text: results }],
    };
  }
);

// --- armory_briefing ---
server.tool(
  "armory_briefing",
  "Get a context-aware briefing of relevant Armory knowledge for the current project or topic. Reads project context and matches against stored notes.",
  {
    project: z.string().optional().describe("Project name (e.g. 'habit-tracker', 'recipe-app', 'Armory')"),
    topic: z.string().optional().describe("Specific topic to brief on (e.g., 'MCP server patterns', 'React optimization')"),
  },
  async ({ project, topic }) => {
    const briefing = await getBriefing({ project, topic });
    return {
      content: [{ type: "text" as const, text: briefing }],
    };
  }
);

// --- armory_cheatsheet ---
server.tool(
  "armory_cheatsheet",
  "Read a category cheatsheet from The Armory. Returns the distilled quick-reference for a given category.",
  {
    category: z.string().describe("Category: ai-coding, prompt-engineering, mcp, claude-code, workflow, tools, devops, design, business"),
  },
  async ({ category }) => {
    const content = await getCheatsheet({ category });
    return {
      content: [{ type: "text" as const, text: content }],
    };
  }
);

// --- armory_stats ---
server.tool(
  "armory_stats",
  "Get Armory vault statistics — note counts by category, recent additions, unprocessed inbox items.",
  {},
  async () => {
    const stats = await getStats();
    return {
      content: [{ type: "text" as const, text: stats }],
    };
  }
);

// --- armory_send_message ---
server.tool(
  "armory_send_message",
  "Send an iMessage to the configured recipient. Use for digest notifications, ingestion summaries, status updates, or any time you need to communicate outside the terminal session.",
  {
    message: z.string().describe("The message to send via iMessage"),
  },
  async ({ message }) => {
    const result = await sendMessage({ message });
    return {
      content: [{ type: "text" as const, text: result }],
    };
  }
);

// --- armory_read_messages ---
server.tool(
  "armory_read_messages",
  "Read recent iMessages from the conversation with the configured recipient. Use to check for URLs they sent for ingestion, commands, or replies to digest notifications.",
  {
    limit: z.number().optional().default(10).describe("Max messages to return"),
    since_minutes: z.number().optional().describe("Only return messages from the last N minutes"),
    only_from_user: z.boolean().optional().default(false).describe("Only show messages FROM the user (not sent by the assistant)"),
  },
  async ({ limit, since_minutes, only_from_user }) => {
    const result = await readMessages({
      limit: limit ?? 10,
      since_minutes: since_minutes ?? undefined,
      only_from_user: only_from_user ?? false,
    });
    return {
      content: [{ type: "text" as const, text: result }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Armory MCP server error:", err);
  process.exit(1);
});
