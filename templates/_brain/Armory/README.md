---
tags: [armory, readme]
---

# The Armory

> Your personal knowledge vault. Ingested notes, curated cheatsheets, and the focus areas that shape what Claude surfaces to you.

## What's in here

| File/Folder | What it's for |
|---|---|
| `Focus.md` | Your current focus areas. `/welcome` populates this; `/audit` updates it over time. |
| `Index.md` | Table of contents for the Armory — auto-updated as notes are added. |
| `Cheatsheets/` | Curated, high-level summaries of key topics. Generated from ingested notes. |
| `Notes/` | Ingested notes from URLs (videos, articles, TikToks) via `/ingest`. |
| `Investigations/` | `/investigate` output — verified/debunked claims from your notes. |
| `Digests/` | Weekly `/digest` output — what you learned this week. |

## How to use it

**Ingest:** drop a YouTube video link, TikTok URL, or article URL:
```
/ingest https://youtu.be/some-video
```
The skill extracts the transcript, summarizes it, tags it with your focus areas, and adds it to `Notes/`.

**Review:** the Armory MCP server (bundled in the kit) gives Claude real-time search access to your notes. Just ask Claude about a topic and it'll pull relevant notes in.

**Focus-aware:** if you set focus areas in `Focus.md`, the Armory tailors itself — `/today` prioritizes notes relevant to your active work, `/audit` reports which ingested content you've actually used, and new ingests ask whether to tag to a focus area.

**Self-learning mode:** if you set `auto_learn: true` in `Focus.md`, the Armory quietly notices what topics you engage with and suggests focus areas after it has enough data. You approve before anything gets added. Good for people who don't know yet what they want to build — the system meets you where you are.

## When to run each skill

| Skill | When |
|---|---|
| `/ingest <url>` | When you find a video or article worth remembering |
| `/scout` | When you want Claude to go hunt for new tools/techniques (automated on schedule) |
| `/investigate` | When a note makes a claim you want to verify before acting on |
| `/digest` | Weekly — produces a summary of what you've learned |
| `/audit` | When you want to know if you're actually USING what you've ingested |
