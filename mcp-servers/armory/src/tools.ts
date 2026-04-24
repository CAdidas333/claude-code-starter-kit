import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { execFileSync } from "child_process";
import { homedir } from "os";
import matter from "gray-matter";
import Database from "better-sqlite3";

const HOME = process.env.HOME ?? homedir();
const BRAIN_ARMORY = join(HOME, "Projects/_brain/Armory");
const NOTES_DIR = join(BRAIN_ARMORY, "Notes");
const CHEATSHEETS_DIR = join(BRAIN_ARMORY, "Cheatsheets");
const INBOX_FILE = join(BRAIN_ARMORY, "Inbox-Queue.md");
const ICLOUD_INBOX = join(
  HOME,
  "Library/Mobile Documents/iCloud~is~workflow~my~workflows/Documents/armory-inbox.txt"
);
const PROJECTS_DIR = join(HOME, "Projects");
const CHAT_DB = join(HOME, "Library/Messages/chat.db");
const IMESSAGE_SEND_SCRIPT =
  process.env.ARMORY_IMESSAGE_SEND_SCRIPT ?? join(PROJECTS_DIR, "Armory/scripts/imessage-send.sh");
const ARMORY_CONFIG = join(HOME, ".claude/armory-config.sh");

interface NoteMeta {
  filename: string;
  title: string;
  source_url: string;
  source_type: string;
  channel: string;
  duration: string;
  date_ingested: string;
  category: string;
  tags: string[];
  relevance_score: number;
  related_projects: string[];
  tldr: string;
  takeaways: string[];
}

function parseNote(filepath: string): NoteMeta | null {
  try {
    const raw = readFileSync(filepath, "utf-8");
    const { data, content } = matter(raw);

    // Extract TL;DR section
    const tldrMatch = content.match(/## TL;DR\n([\s\S]*?)(?=\n##|\n$)/);
    const tldr = tldrMatch ? tldrMatch[1].trim() : "";

    // Extract Key Takeaways
    const takeawaysMatch = content.match(/## Key Takeaways\n([\s\S]*?)(?=\n##|\n$)/);
    const takeaways: string[] = [];
    if (takeawaysMatch) {
      const lines = takeawaysMatch[1].split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ")) {
          takeaways.push(trimmed.slice(2));
        }
      }
    }

    return {
      filename: basename(filepath, ".md"),
      title: data.title ?? basename(filepath, ".md"),
      source_url: data.source_url ?? "",
      source_type: data.source_type ?? "unknown",
      channel: data.channel ?? "",
      duration: data.duration ?? "",
      date_ingested: data.date_ingested ?? "",
      category: data.category ?? "other",
      tags: Array.isArray(data.tags) ? data.tags : [],
      relevance_score: data.relevance_score ?? 0,
      related_projects: Array.isArray(data.related_projects) ? data.related_projects : [],
      tldr,
      takeaways,
    };
  } catch {
    return null;
  }
}

function loadAllNotes(): NoteMeta[] {
  if (!existsSync(NOTES_DIR)) return [];
  const files = readdirSync(NOTES_DIR).filter((f) => f.endsWith(".md"));
  const notes: NoteMeta[] = [];
  for (const file of files) {
    const note = parseNote(join(NOTES_DIR, file));
    if (note) notes.push(note);
  }
  return notes;
}

function scoreMatch(note: NoteMeta, query: string, category?: string, tags?: string[]): number {
  let score = 0;
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  // Title match (highest weight)
  const titleLower = note.title.toLowerCase();
  for (const word of words) {
    if (titleLower.includes(word)) score += 10;
  }

  // TL;DR match
  const tldrLower = note.tldr.toLowerCase();
  for (const word of words) {
    if (tldrLower.includes(word)) score += 5;
  }

  // Tag match
  for (const word of words) {
    if (note.tags.some((t) => t.toLowerCase().includes(word))) score += 8;
  }

  // Takeaway match
  for (const takeaway of note.takeaways) {
    const takeLower = takeaway.toLowerCase();
    for (const word of words) {
      if (takeLower.includes(word)) score += 3;
    }
  }

  // Channel match
  if (note.channel.toLowerCase().includes(q)) score += 4;

  // Category filter (exact match required)
  if (category && note.category !== category) return 0;

  // Tag filter (any match)
  if (tags && tags.length > 0) {
    const hasTag = tags.some((t) => note.tags.includes(t));
    if (!hasTag) return 0;
  }

  // Boost by relevance score
  score += note.relevance_score;

  return score;
}

export async function searchNotes(params: {
  query: string;
  category?: string;
  tags?: string[];
  limit: number;
}): Promise<string> {
  const notes = loadAllNotes();
  if (notes.length === 0) {
    return "No notes in The Armory yet. Use `/ingest <url>` to add content.";
  }

  const scored = notes
    .map((note) => ({ note, score: scoreMatch(note, params.query, params.category, params.tags) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit);

  if (scored.length === 0) {
    return `No matches for "${params.query}"${params.category ? ` in category ${params.category}` : ""}. ${notes.length} total notes in vault.`;
  }

  const lines: string[] = [`## Armory Search: "${params.query}"`, `${scored.length} result(s) from ${notes.length} total notes\n`];

  for (const { note, score } of scored) {
    lines.push(`### ${note.title}`);
    lines.push(`- **Category:** ${note.category} | **Relevance:** ${note.relevance_score}/5 | **Match:** ${score}`);
    lines.push(`- **Tags:** ${note.tags.join(", ")}`);
    lines.push(`- **Source:** ${note.source_type} — ${note.channel} (${note.duration})`);
    lines.push(`- **TL;DR:** ${note.tldr}`);
    if (note.related_projects.length > 0) {
      lines.push(`- **Related projects:** ${note.related_projects.join(", ")}`);
    }
    lines.push(`- **Note:** [[${note.filename}]]`);
    lines.push("");
  }

  return lines.join("\n");
}

export async function getBriefing(params: {
  project?: string;
  topic?: string;
}): Promise<string> {
  const notes = loadAllNotes();
  if (notes.length === 0) {
    return "The Armory is empty. No briefing available yet. Use `/ingest <url>` to start building your knowledge vault.";
  }

  let relevantNotes = notes;

  // Filter by project if specified
  if (params.project) {
    const projectNotes = notes.filter((n) =>
      n.related_projects.some((p) => p.toLowerCase() === params.project!.toLowerCase())
    );
    // If project filter yields results, use those; otherwise fall back to all notes
    if (projectNotes.length > 0) {
      relevantNotes = projectNotes;
    }
  }

  // If topic specified, score and sort
  if (params.topic) {
    relevantNotes = relevantNotes
      .map((note) => ({ note, score: scoreMatch(note, params.topic!, undefined, undefined) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.note);
  } else {
    // Sort by relevance score, then by date (newest first)
    relevantNotes = relevantNotes.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
      return String(b.date_ingested).localeCompare(String(a.date_ingested));
    });
  }

  // Take top 5
  const top = relevantNotes.slice(0, 5);

  // Count inbox items
  let inboxCount = 0;
  try {
    if (existsSync(INBOX_FILE)) {
      const inbox = readFileSync(INBOX_FILE, "utf-8");
      inboxCount += (inbox.match(/- \[ \]/g) ?? []).length;
    }
    if (existsSync(ICLOUD_INBOX)) {
      const icloud = readFileSync(ICLOUD_INBOX, "utf-8");
      inboxCount += (icloud.match(/- \[ \]/g) ?? []).length;
    }
  } catch { /* ignore */ }

  const lines: string[] = [];
  lines.push(`## Armory Briefing${params.project ? ` — ${params.project}` : ""}${params.topic ? ` — "${params.topic}"` : ""}`);
  lines.push(`${notes.length} notes in vault | ${inboxCount} items in inbox\n`);

  if (inboxCount > 0) {
    lines.push(`> **${inboxCount} unprocessed items in inbox.** Run \`/ingest --batch\` to process them.\n`);
  }

  if (top.length === 0) {
    lines.push("No relevant notes found for this context.");
  } else {
    lines.push("### Relevant Knowledge\n");
    for (const note of top) {
      lines.push(`**${note.title}** (${note.category}, ${note.relevance_score}/5)`);
      lines.push(`${note.tldr}`);
      if (note.takeaways.length > 0) {
        lines.push(`Top takeaway: ${note.takeaways[0]}`);
      }
      lines.push(`→ [[${note.filename}]]\n`);
    }
  }

  // List available cheatsheets
  if (existsSync(CHEATSHEETS_DIR)) {
    const cheatsheets = readdirSync(CHEATSHEETS_DIR).filter((f) => f.endsWith(".md"));
    if (cheatsheets.length > 0) {
      lines.push("### Available Cheatsheets");
      for (const cs of cheatsheets) {
        lines.push(`- ${basename(cs, ".md")}`);
      }
    }
  }

  return lines.join("\n");
}

// Strict allow-list for cheatsheet category names. Only lowercase ASCII
// letters and hyphens are permitted. Any other input is rejected before
// it can reach the filesystem.
const CATEGORY_RE = /^[a-z][a-z-]*[a-z]$|^[a-z]$/;

export async function getCheatsheet(params: { category: string }): Promise<string> {
  if (!CATEGORY_RE.test(params.category)) {
    return `Invalid category "${params.category}". Categories must be lowercase letters and hyphens only.`;
  }
  const categoryLower = params.category.toLowerCase();

  if (!existsSync(CHEATSHEETS_DIR)) {
    return `No cheatsheet found for category "${params.category}". Available categories can be seen via armory_stats.`;
  }

  // List cheatsheet files that actually exist on disk. The user input is
  // only used as a lookup key against this pre-enumerated set — the path
  // handed to readFileSync is always a filename we discovered via
  // readdirSync, not one constructed from user input. This eliminates any
  // path-traversal surface because params.category never touches
  // path.join directly.
  const files = readdirSync(CHEATSHEETS_DIR).filter((f) => f.endsWith(".md"));

  // Prefer an exact (case-insensitive) match on the base name; fall back
  // to substring match to preserve the previous behavior.
  let matchedFile = files.find((f) => basename(f, ".md").toLowerCase() === categoryLower);
  if (!matchedFile) {
    matchedFile = files.find((f) => f.toLowerCase().includes(categoryLower));
  }

  if (!matchedFile) {
    return `No cheatsheet found for category "${params.category}". Available categories can be seen via armory_stats.`;
  }

  // Safety belt: ensure the matched filename has no path separators or
  // traversal sequences before joining. readdirSync returns basenames, so
  // this is defense-in-depth.
  if (matchedFile.includes("/") || matchedFile.includes("\\") || matchedFile.includes("..")) {
    return `Invalid cheatsheet filename "${matchedFile}".`;
  }

  return readFileSync(join(CHEATSHEETS_DIR, matchedFile), "utf-8");
}

export async function getStats(): Promise<string> {
  const notes = loadAllNotes();

  // Count by category
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalRelevance = 0;

  for (const note of notes) {
    byCategory[note.category] = (byCategory[note.category] ?? 0) + 1;
    byType[note.source_type] = (byType[note.source_type] ?? 0) + 1;
    totalRelevance += note.relevance_score;
  }

  // Count inbox items
  let inboxCount = 0;
  let icloudCount = 0;
  try {
    if (existsSync(INBOX_FILE)) {
      const inbox = readFileSync(INBOX_FILE, "utf-8");
      inboxCount = (inbox.match(/- \[ \]/g) ?? []).length;
    }
    if (existsSync(ICLOUD_INBOX)) {
      const icloud = readFileSync(ICLOUD_INBOX, "utf-8");
      const lines = icloud.split("\n").filter((l) => l.trim().startsWith("- [ ]"));
      icloudCount = lines.length;
    }
  } catch { /* ignore */ }

  // Count cheatsheets
  let cheatsheetCount = 0;
  const cheatsheetNames: string[] = [];
  if (existsSync(CHEATSHEETS_DIR)) {
    const files = readdirSync(CHEATSHEETS_DIR).filter((f) => f.endsWith(".md"));
    cheatsheetCount = files.length;
    cheatsheetNames.push(...files.map((f) => basename(f, ".md")));
  }

  // Recent notes (last 5)
  const recent = [...notes]
    .sort((a, b) => String(b.date_ingested).localeCompare(String(a.date_ingested)))
    .slice(0, 5);

  const lines: string[] = [];
  lines.push("## Armory Stats\n");
  lines.push(`**Total notes:** ${notes.length}`);
  lines.push(`**Avg relevance:** ${notes.length > 0 ? (totalRelevance / notes.length).toFixed(1) : "N/A"}`);
  lines.push(`**Cheatsheets:** ${cheatsheetCount}`);
  lines.push(`**Inbox pending:** ${inboxCount + icloudCount} (${inboxCount} local, ${icloudCount} from iPhone)\n`);

  if (Object.keys(byCategory).length > 0) {
    lines.push("### By Category");
    for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${cat}: ${count}`);
    }
    lines.push("");
  }

  if (Object.keys(byType).length > 0) {
    lines.push("### By Source Type");
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${type}: ${count}`);
    }
    lines.push("");
  }

  if (recent.length > 0) {
    lines.push("### Recent Notes");
    for (const note of recent) {
      lines.push(`- ${note.date_ingested} | **${note.title}** (${note.category}, ${note.relevance_score}/5)`);
    }
    lines.push("");
  }

  if (cheatsheetNames.length > 0) {
    lines.push("### Cheatsheets");
    for (const name of cheatsheetNames) {
      lines.push(`- ${name}`);
    }
  }

  return lines.join("\n");
}

// ==================== iMessage ====================

function extractTextFromAttributedBody(ab: Buffer): string | null {
  const nsStringMarker = Buffer.from("NSString");
  const idx = ab.indexOf(nsStringMarker);
  if (idx === -1) return null;

  const plusByte = 0x2b; // '+'
  const plusIdx = ab.indexOf(plusByte, idx + 8);
  if (plusIdx === -1) return null;

  const lengthByte = ab[plusIdx + 1];
  let textLen: number;
  let textStart: number;

  if (lengthByte < 0x80) {
    textLen = lengthByte;
    textStart = plusIdx + 2;
  } else if (lengthByte === 0x81) {
    textLen = ab.readUInt16LE(plusIdx + 2);
    textStart = plusIdx + 4;
  } else if (lengthByte === 0x82) {
    textLen = ab[plusIdx + 2] | (ab[plusIdx + 3] << 8) | (ab[plusIdx + 4] << 16);
    textStart = plusIdx + 5;
  } else if (lengthByte === 0x83) {
    textLen = ab.readUInt32LE(plusIdx + 2);
    textStart = plusIdx + 6;
  } else {
    return null;
  }

  const textBytes = ab.subarray(textStart, textStart + textLen);
  try {
    return textBytes.toString("utf-8");
  } catch {
    return null;
  }
}

// Reads the configured iMessage recipient handle (phone number or email)
// from ~/.claude/armory-config.sh. Returns an empty string if no config is
// present — caller should treat an empty handle as "no iMessage integration
// configured" and skip iMessage features gracefully.
function getRecipientHandleId(): string {
  try {
    const config = readFileSync(ARMORY_CONFIG, "utf-8");
    const match = config.match(/ARMORY_IMESSAGE_RECIPIENT="?([^"\n]+)"?/);
    if (match) return match[1];
  } catch { /* fall through */ }
  return "";
}

// Reads an optional additional iMessage identifier (e.g., email alias) from
// the armory config. Used for matching messages in chat.db when the
// recipient has multiple contact methods tied to the same conversation.
function getRecipientExtraIds(): string[] {
  try {
    const config = readFileSync(ARMORY_CONFIG, "utf-8");
    const match = config.match(/ARMORY_IMESSAGE_EXTRA_IDS="?([^"\n]+)"?/);
    if (match) {
      return match[1].split(",").map((s) => s.trim()).filter(Boolean);
    }
  } catch { /* fall through */ }
  return [];
}

interface MessageRow {
  ROWID: number;
  text: string | null;
  attributedBody: Buffer | null;
  is_from_me: number;
  date: number;
  handle_id: string | null;
}

export async function readMessages(params: {
  limit: number;
  since_minutes?: number;
  only_from_user?: boolean;
}): Promise<string> {
  if (!existsSync(CHAT_DB)) {
    return "Error: Cannot access iMessage database. Full Disk Access may not be granted.";
  }

  const recipientId = getRecipientHandleId();
  if (!recipientId) {
    return "Error: iMessage recipient not configured. Set ARMORY_IMESSAGE_RECIPIENT in ~/.claude/armory-config.sh.";
  }

  const db = new Database(CHAT_DB, { readonly: true });

  try {
    const CHAT_IDENTIFIERS = [
      recipientId.replace("+1", ""),  // phone number without country prefix
      ...getRecipientExtraIds(),       // any additional configured identifiers
    ];
    let query = `
      SELECT m.ROWID, m.text, m.attributedBody, m.is_from_me,
             m.date/1000000000 + 978307200 as unix_ts,
             datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as readable_date,
             h.id as handle_id
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE (${CHAT_IDENTIFIERS.map(() => "h.id LIKE ?").join(" OR ")})
    `;
    const queryParams: (string | number)[] = CHAT_IDENTIFIERS.map((id) => `%${id}%`);

    if (params.since_minutes) {
      const cutoff = Math.floor(Date.now() / 1000) - (params.since_minutes * 60);
      const macCutoff = (cutoff - 978307200) * 1000000000;
      query += " AND m.date > ?";
      queryParams.push(macCutoff);
    }

    if (params.only_from_user) {
      query += " AND m.is_from_me = 0";
    }

    query += " ORDER BY m.date DESC LIMIT ?";
    queryParams.push(params.limit);

    const rows = db.prepare(query).all(...queryParams) as (MessageRow & { unix_ts: number; readable_date: string })[];

    if (rows.length === 0) {
      return params.since_minutes
        ? `No messages in the last ${params.since_minutes} minutes.`
        : "No messages found.";
    }

    const lines: string[] = [`## iMessage — ${rows.length} message(s)\n`];

    for (const row of rows.reverse()) {
      const text = row.text || (row.attributedBody ? extractTextFromAttributedBody(row.attributedBody as Buffer) : null) || "(attachment/empty)";
      const direction = row.is_from_me ? "Assistant →" : "User →";
      lines.push(`**${direction}** (${row.readable_date})`);
      lines.push(text);
      lines.push("");
    }

    return lines.join("\n");
  } finally {
    db.close();
  }
}

export async function sendMessage(params: {
  message: string;
}): Promise<string> {
  if (!existsSync(IMESSAGE_SEND_SCRIPT)) {
    return "Error: imessage-send.sh not found at " + IMESSAGE_SEND_SCRIPT;
  }

  try {
    // Use execFileSync with an array of args: no shell is spawned, so the
    // message string is passed verbatim to the script's $1 with no
    // metacharacter interpretation. Functionally equivalent to the
    // previous `bash <script> <message>` invocation, but without a
    // command-injection surface.
    const result = execFileSync("bash", [IMESSAGE_SEND_SCRIPT, params.message], {
      timeout: 10000,
      encoding: "utf-8",
    });
    return result.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return "Failed to send iMessage: " + msg;
  }
}
