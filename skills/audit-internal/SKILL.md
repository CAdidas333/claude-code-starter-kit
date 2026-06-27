---
name: audit-internal
description: Internal consistency auditor for _brain/. Reads Armory Notes, Cheatsheets, Investigations, and per-project MASTER_CONTEXTs. Detects 7 types of drift (contradiction, stale_entry, redundant_coverage, missing_xref, unintegrated, source_drift, coverage_gap). Emits structured findings via 8-field Finding schema with verification_query so Brain can independently verify. Hands top-5 findings to Brain via Nerve Center. Never modifies anything — read-only auditor role.
effort: high
allowed-tools: Read, Write, Glob, Grep, Bash
---

Internal consistency auditor for `_brain/`. Reads Armory Notes, Cheatsheets, Investigations, and per-project MASTER_CONTEXTs. Detects drift, contradictions, stale knowledge, and coverage gaps. Hands findings to Brain (Overwatch) for independent verification. **Read-only — never modifies anything.**

**Usage:**
- `/audit-internal` — Run a full audit cycle, emit top-5 findings, message Brain, send an iMessage summary
- `/audit-internal --dry-run` — Generate the report and print to stdout but do NOT write the report file, do NOT message Brain, do NOT send iMessage
- `/audit-internal --check=<type>` — Run only a single check type (one of: contradiction, stale_entry, redundant_coverage, missing_xref, unintegrated, source_drift, coverage_gap). Useful during development or for targeted re-audits.
- `/audit-internal --file <path>` — Reactive per-file mode. Audit a single file as the pivot (see Step 0). Used by `com.armory.overwatch` daemon for near-real-time feedback on `_brain/` edits.
- `/audit-internal --status` — Show the last N audit cycle summaries (run dates, finding counts, scores)

---

## What this skill does

Audits your Armory knowledge vault for internal consistency — finding contradictions between notes, stale entries, redundant coverage, broken cross-references, unintegrated knowledge, and coverage gaps. It is read-only: it emits a structured report and hands findings to the Brain thread for independent verification. Run it periodically (or via a scheduled daemon) to keep your knowledge base from drifting.

## Architectural Constraints (Load-Bearing)

This skill is HALF of a dual-redundant accountability system. The other half is `/overwatch-review` (Brain side). Two rules are non-negotiable:

1. **Read-only.** This skill writes ONE file (the audit report) and ONE inbox message. It never modifies notes, cheatsheets, context docs, or any other state. All proposed fixes go through Brain for independent verification.
2. **Non-overlapping primary sources.** This skill reads `_brain/Armory/Notes/`, `_brain/Armory/Cheatsheets/`, `_brain/Armory/Investigations/`, and per-project `docs/context/MASTER_CONTEXT.md` files. It deliberately does NOT read `_brain/Dashboard.md`, `_brain/Lessons.md`, `_brain/Decisions/`, `_brain/Cross-Project-Architecture.md`, `_brain/<maintainer-profile>.md`, or per-project `SESSION_LOG.md` files — those are Brain's primary sources, reserved so Brain can verify findings against context the auditor didn't see (verification collusion mitigation).

The full design rationale lives in `~/Projects/Ideas/Braindumps/2026-04-11_Armory-Overwatch-Audit-Architecture.md`. Read it before making structural changes to this skill.

---

## Step 0: Per-File Mode (`--file <path>`)

Used by `com.armory.overwatch` daemon for reactive, near-real-time auditing of individual `_brain/` files as they change. Behavior differs from full mode:

**Scope constraint.**
- Treat `<path>` as the pivot. Only run the checks where `<path>` can be the `primary_file` OR `secondary_file`.
- If `<path>` is in the OUT-OF-SCOPE list (Step 1), exit 0 silently — the overwatch daemon fires on any `_brain/` change and will often hit files the auditor is not allowed to read. That is not an error.
- If `<path>` does not exist or is not a `.md` file, exit 0 silently.

**Check dispatch by target type.**
- Target under `Notes/`: run `contradiction` (against other notes in its cluster), `redundant_coverage` (if target's slug shares tokens with 2+ others), `missing_xref` (pair checks involving target), `unintegrated` (only if target has `relevance_score >= 4`), `source_drift` (target's claims vs operational docs).
- Target is `Almost-Done.md`, a cheatsheet, or a MASTER_CONTEXT: run `stale_entry` (target as primary), `source_drift` (target as primary).
- Target is `Tool-Stack.md`: run `coverage_gap` (target as primary), `source_drift`.
- Target is `Inbox-Queue.md`: run `stale_entry` (pending-section staleness only).

**Output differences.**
- No top-5 filter. Emit every finding that clears the confidence floor. Per-file findings should be rare; filtering hides them.
- Do NOT write a report file. Do NOT append to `inbox-brain.md`. Do NOT send an iMessage.
- Print findings to stdout as a compact summary: `type | confidence | primary_file | one-line-action`. One finding per line.
- If zero findings, exit 0 silently with no output. The overwatch daemon checks stdout; silence = clean.
- Append a line to `~/.claude/armory-overwatch.log`: `ISO-8601 | path | N findings`.

**Opt-in notification.**
- If `--notify` is ALSO passed, high-severity findings (risk_level=high OR confidence >= 0.85) fire a single iMessage summary through `scripts/imessage-send.sh`. The hourly scheduled daemon does NOT set `--notify` (the hourly report is the notification). The reactive overwatch daemon sets `--notify` so the maintainer hears about serious drift the moment it appears.

**Cost guardrail.**
- Per-file mode must stay under 5K tokens input + 2K output. If the target is large and the cluster is huge, truncate to the 10 most-similar peer notes and note the truncation in the log.

---

## Step 1: Load Audit Scope

Enumerate the files this audit will read.

**IN SCOPE:**
- `~/Projects/_brain/Armory/Notes/*.md` — all Armory notes (primary source for stale/redundant/coverage checks)
- `~/Projects/_brain/Armory/Cheatsheets/*.md` — all cheatsheets (primary source for stale_entry / source_drift)
- `~/Projects/_brain/Armory/Investigations/*.md` — all investigation reports (cross-reference source for consistency)
- `~/Projects/_brain/Armory/Inbox-Queue.md` — the ingestion queue (catches in-flight items)
- `~/Projects/_brain/Armory/Index.md` — only as metadata, not for content claims
- `~/Projects/_brain/Almost-Done.md` — cross-checked against current Dashboard state
- `~/Projects/_brain/Tool-Stack.md` — claims about which tools we use
- `~/Projects/_brain/Features/*.md` — feature docs (can contain wiki-links that need cross-reference checking)
- Per-project `~/Projects/{project-1,project-2,...}/docs/context/MASTER_CONTEXT.md` _(customize to your project list)_

**EXPLICITLY OUT OF SCOPE (do not read):**
- `~/Projects/_brain/Armory/AuditReports/` — audit output must not feed audit input (recursive drift safeguard)
- `~/Projects/_brain/Comms/` — ephemeral inter-thread messages, watcher state, broadcast
- `~/Projects/_brain/Brand/`, `_brain/IP/`, `_brain/Launch/`, `_brain/Reports/` — different review cycles, not knowledge content
- `~/Projects/_brain/Dashboard.md`, `_brain/Lessons.md`, `_brain/Cross-Project-Architecture.md`, `_brain/<maintainer-profile>.md`, `_brain/Decisions/` — Brain's primary sources (reserved for verification)
- Per-project `SESSION_LOG.md` files — also Brain's primary sources
- Any file with `audit_output: true` in frontmatter

Build a working list of in-scope files. Print the count for the run header.

---

## Step 2: Run the 7 Check Types

For each check type below, scan the in-scope files and emit Finding objects per the schema in Step 3. Apply per-check confidence floors before emitting — anything below the floor is dropped silently. Findings accumulate into a working list passed to Step 4.

### Check 1: contradiction (confidence floor 0.7, type_priority 5)

**Goal:** Detect direct factual contradictions between two Armory notes about the same tool, technique, or configuration value. Distinct from `source_drift` (which compares operational docs to notes) — this check compares notes to notes.

**Step 1.1 — Cluster notes by topic.**

Use Glob to list all `~/Projects/_brain/Armory/Notes/*.md`. For each note, read the frontmatter `tags` field and the `aliases` field. Group notes that share at least 2 tags OR share an alias. The cluster is the candidate set for pairwise comparison.

**Step 1.2 — Pairwise compare within each cluster.**

For each pair of notes in the same cluster:
1. Read both notes' "Key Takeaways" and "Actionable for Your Projects" sections.
2. Extract concrete factual claims: tool names, version numbers, configuration values (e.g., `autoCompactWindow: 75%`), schedule values (e.g., "runs every 30 min"), capability claims (e.g., "supports streaming").
3. For each claim category present in BOTH notes, compare the values.
4. If values match → no finding. If values disagree → potential contradiction.

**Step 1.3 — Apply timeline flag.**

For every potential contradiction, check the `date_ingested` frontmatter field of both notes. If the difference is greater than 7 days, set `timeline_flag: true` — Brain should treat this as possible supersession rather than conflict. If the dates are within 7 days, leave `timeline_flag: false` — this is more likely a real contradiction (two recent sources disagreeing).

**Step 1.4 — Construct findings.**

Confidence: 0.85 if direct numeric/string contradiction, 0.75 if categorical disagreement, drop below 0.70.

```yaml
finding_id: "f-{today}-{seq}"
type: contradiction
confidence: {0.70-0.85}
primary_file: {older note}
secondary_file: {newer note}
primary_excerpt: {the contradicting claim from primary, max 200 chars}
secondary_excerpt: {the contradicting claim from secondary, max 200 chars}
proposed_action_type: escalate (most contradictions need the maintainer's call)
proposed_action: "Both notes claim different values for {fact}. Determine which is correct. If newer is correct: prune older. If older is correct: update newer. If both contexts are valid: add disambiguation."
timeline_flag: {true|false per Step 1.3}
verification_query: "Open both files, check the relevant Key Takeaway lines. If the values still disagree, this is VERIFIED. If timeline_flag is true and the newer note explicitly references the older with 'supersedes', mark DISPUTED(supersession) and route to NEEDS-CHRIS for prune decision."
risk_level: medium (almost always — contradictions touch knowledge integrity)
reversible: false (any prune is a destructive action — git commit before applying)
```

**Cap:** Maximum 3 contradiction findings per cycle, even if more exist. Contradictions are high-effort for Brain to verify, so be selective. Prefer the highest-confidence pairs.

### Check 2: stale_entry (confidence floor 0.65, type_priority 3)

**Goal:** Detect entries in cheatsheets, manifests, or task lists that are no longer accurate because newer information has superseded them OR because they should have been pruned per the document's own rules but weren't.

**Step 2.1 — Detect strikethrough orphans first (high-confidence quick wins).**

Read `~/Projects/_brain/Almost-Done.md` line by line. For every line containing markdown strikethrough syntax (`~~text~~`), this is a "DONE" item that the document's own header rules say should have been deleted ("When you finish something, delete it from here"). Each such line is a `stale_entry` finding with confidence 0.95, risk_level low, reversible true, proposed_action_type prune, proposed_action "Delete line N from Almost-Done.md (struck-through DONE item per file's own rule)". The verification_query: "Read ~/Projects/_brain/Almost-Done.md line N. If it still contains ~~strikethrough~~ markup, this finding is VERIFIED."

Apply the same rule to any other file in scope that has its own "delete when done" convention — but for now, only `Almost-Done.md` is known to have this rule. Don't generalize without evidence.

**Step 2.2 — Detect cheatsheet entries superseded by newer notes.**

For each row in `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` that names a specific tool, version, flag, or daemon, do the following:

1. Extract the entry's key claim: `(tool_name, claimed_state)`. Examples: `("autoCompactWindow", "75%")`, `("scout daemon", "8AM + 6PM")`, `("watcher daemon", "120s")`.
2. Search `~/Projects/_brain/Armory/Notes/*.md` for any note mentioning the same tool. Sort matches by `date_ingested` frontmatter field (newest first).
3. For the newest matching note, read its "Key Takeaways" and "Actionable for Your Projects" sections. Extract any state claim about that tool.
4. Compare the cheatsheet's claimed state to the newest note's claimed state. If they disagree → emit a stale_entry finding.

Confidence calibration:
- Direct value contradiction (different number, version, or schedule): 0.85
- Note explicitly says "superseded by" or "replaced by": 0.90
- Note implies a different state without explicit contradiction: 0.70 (at floor — surfaces but borderline)

Set `timeline_flag: true` always for stale_entry — Brain should verify the supersession is real.

**Step 2.3 — Detect ingestion-queue staleness.**

Read `~/Projects/_brain/Armory/Inbox-Queue.md`. For each item in the "Pending" section that is more than 14 days old (compare `date` field in the line against today), emit a stale_entry finding suggesting it be moved to a "Stale" or "Skipped" section. Confidence 0.75, risk_level low, action prune-or-archive.

**Step 2.4 — Construct findings.**

```yaml
finding_id: "f-{today}-{seq}"
type: stale_entry
confidence: {0.65-0.95 per detection method}
primary_file: {the cheatsheet/manifest/queue file containing the stale entry}
secondary_file: {the newer note that supersedes it, or null for strikethrough orphans}
primary_excerpt: {the stale line, max 200 chars}
secondary_excerpt: {the superseding note's relevant section, or null}
proposed_action_type: prune (for strikethrough orphans, queue staleness) | update (for value supersessions)
proposed_action: "Specific instruction with line number and old→new replacement"
timeline_flag: true (always for stale_entry — Brain should verify the supersession is real)
verification_query: "Re-read line {N} of {primary_file}. If it still contains the stale text {excerpt} AND {secondary_file} still contains {newer text}, this finding is VERIFIED. Otherwise mark DISPUTED(stale-finding)."
risk_level: low (strikethrough/queue) | medium (cheatsheet value updates)
reversible: true
```

**Concrete known target for validation:**

`~/Projects/_brain/Almost-Done.md` may accumulate struck-through DONE items over time. Step 2.1 should surface every line containing `~~strikethrough~~` markup — those items should have been deleted per the file's own rule. If Step 2.1 produces zero findings when struck-through lines exist, the detection logic is broken.

### Check 3: redundant_coverage (confidence floor 0.7, type_priority 1)

**Goal:** Detect when 3+ notes cover the same tool, topic, or technique without one being designated canonical. Surface the cluster so Brain can decide whether to merge, prune duplicates, or designate a canonical master.

**Step 3.1 — Cluster notes by filename similarity.**

List all notes with `Glob ~/Projects/_brain/Armory/Notes/*.md`. Strip the date prefix (`YYYY-MM-DD_`) and the `.md` extension to get the slug portion. For each slug, compute a normalized form: lowercase, replace separators with spaces, drop common stopwords ("the", "a", "of", "for"). Group slugs whose normalized forms share 60%+ of their tokens (Jaccard similarity ≥0.6 over token sets).

**Step 3.2 — Reinforce clusters with frontmatter signals.**

For each candidate cluster from Step 3.1, read the frontmatter `tags` and `aliases` fields of each member note. If notes in a cluster ALSO share at least 2 tags or any aliases, increase cluster confidence. If notes in a cluster have completely disjoint tags, that's a false positive — drop the cluster.

**Step 3.3 — Check for designated canonical.**

For each remaining cluster, look at all member notes. Check if any note in the cluster has:
- A `canonical: true` frontmatter field, OR
- Cross-references (`[[other-note]]` or `See also`) from the other notes pointing to it as the master, OR
- An "Also covered in" section in another note pointing to it

If exactly ONE note is designated canonical, the cluster is healthy → no finding.

**Step 3.4 — Classify cluster by `source_url` (CRITICAL — determines proposed_action).**

For every member note in an uncrowned cluster of 3+, read frontmatter `source_url` and `date_ingested` (or fall back to filename date). Then classify the cluster into one of two mutually-exclusive classes:

**Class A — Same-source dup-race (auto-prunable).**
All `source_url` values are identical AND all `date_ingested` (or filename) dates fall within a 1-day window of each other. This is the watcher dup-race artifact pattern Brain documented in `_brain/Decisions/Bulk-Dedup-2026-06-10.md`. The maintainer has authorized standing auto-prune for this class.

→ Proposed action: **VERIFIED-AUTOFIXABLE prune.** Designate the newest as canonical (`canonical: true` frontmatter), absorb TL;DRs into it, prune the rest. Brain will execute without re-asking the maintainer.

**Class B — Distinct-source topical cluster (canonical+xref ONLY, NEVER prune).**
`source_url` values differ across notes (different creators, different posts, different sources covering the same topic) OR same-source notes are spread across >1-day window (e.g., version-distinct docs/changelog URLs — see the 6-note `code.claude.com/docs/en/changelog` family). Each note is a distinct piece of source material; pruning destroys real signal.

→ Proposed action: **canonical+xref only.** Designate the most recent or most authoritative as `canonical: true`, add reciprocal `[[wiki-link]]` cross-references between siblings. **Do NOT propose merge or prune.** Brain will route prune-authority-extension for distinct-source clusters to the maintainer as a separate policy question, not execute it.

**History (why this matters):** Brain has DISPUTED Class B prune proposals in three consecutive cycles (codex 0247, codex manual4, mobile-MCP) because the earlier skill version proposed "merge or prune" generically. Each DISPUTE costs a verification round-trip and risks corpus damage. The classification above ends the loop.

**Step 3.5 — Emit findings for uncrowned clusters of 3+.**

Only clusters with 3 or more notes AND no designated canonical produce findings. Smaller clusters (2 notes covering the same topic) → handle as `missing_xref` (Check 4) instead.

```yaml
finding_id: "f-{today}-{seq}"
type: redundant_coverage
confidence: {0.85 for same-source dup-race (Class A), 0.75 for distinct-source topical (Class B) with striking filename overlap, 0.70 if only frontmatter signals}
cluster_class: {A_same_source | B_distinct_source}  # NEW — must be set per Step 3.4
primary_file: {the most recent note in the cluster — it's the canonical candidate}
secondary_file: null
primary_excerpt: {a representative line from the most recent note, max 200 chars}
secondary_excerpt: null
proposed_action_type: {Class A: autofix_prune | Class B: add_xref}
proposed_action: |
  Class A: "Same-source dup-race ({N} notes, source_url={url}, dates {date_range}). VERIFIED-AUTOFIXABLE per Bulk-Dedup-2026-06-10 rule: designate {primary_file} canonical, absorb TL;DRs, prune the {N-1} duplicates."
  Class B: "Distinct-source topical cluster ({N} notes on '{topic}'; source_urls differ). canonical+xref ONLY: designate {primary_file} canonical, add reciprocal [[wiki-link]] cross-references between siblings. DO NOT propose merge or prune."
timeline_flag: false
verification_query: |
  Class A: "Glob the {N} files in the cluster, read frontmatter source_url + date_ingested. If all source_urls identical AND all dates within 1 day, finding is VERIFIED-AUTOFIXABLE."
  Class B: "Glob the {N} files, read frontmatter source_url. If source_urls differ, finding is VERIFIED as canonical+xref. NOT prunable — same-source-only rule does not authorize."
risk_level: {Class A: low (autofix), Class B: low (xref-only) — neither is destructive when correctly classified}
reversible: {Class A: true (prune lives in git), Class B: true}
```

**Cap:** Maximum 2 redundant_coverage findings per cycle (these are noisy and require maintainer attention).

**Skipped clusters (do NOT surface as redundant_coverage):**

- **Same-URL notes >1-day apart** (changelog/release/docs URLs where the underlying content changed between ingestions — version-distinct, not a dup-race).
- **Clusters already resolved on the 2026-06-10 manifest** (`_brain/Armory/AuditReports/2026-06-10_dedup-manifest.md`): obsidian-adhd, routines, every-cc-workflow, managed-agents, personal-agi, relume, design-unstoppable, mobile-MCP, business-hub, hermes, nexus, remotion, seedance, first-principles. If a cluster's canonical filename appears in that manifest's keep column, the prior cycle already handled it.

**Concrete known target for validation:**

Three notes from 2026-04-03 with near-identical filenames covering MCP servers for mobile app vibe coding:
- `2026-04-03_top-4-mcp-servers-mobile-app-vibe-coding.md`
- `2026-04-03_top-4-mcp-servers-vibe-coding-mobile-app.md`
- `2026-04-03_top-mcp-servers-mobile-app-vibe-coding.md`

All three filenames share the tokens {top, mcp, servers, mobile, app, vibe, coding} — Jaccard similarity is essentially 1.0. None should be designated canonical. This MUST surface as a redundant_coverage finding with confidence ≥0.85 on first run, otherwise Step 3.1 clustering logic is broken.

### Check 4: missing_xref (confidence floor 0.6, type_priority 1)

**Goal:** Detect notes that should reference each other (because they cover the same topic) but don't. Also catches broken `[[wiki-links]]` pointing to files that don't exist.

**Step 4.1 — Detect broken wiki links.**

Glob `~/Projects/_brain/Armory/Notes/*.md` and `~/Projects/_brain/Armory/Cheatsheets/*.md` and `~/Projects/_brain/Tool-Stack.md` and `~/Projects/_brain/Almost-Done.md`. For each file, extract every `[[wiki-link]]` and `[[wiki-link|alias]]` reference. For each reference, check if a file with that base name exists anywhere in `~/Projects/_brain/`. If not → broken_xref finding (treated as a missing_xref subtype).

Example known target: `~/Projects/_brain/Cross-Project-Architecture.md` (NOTE: out of scope for direct read, but its broken xrefs are catchable via the explore findings) references a `[[wiki-link]]` pointing to a file that no longer exists. This is a structural reference, not a content one — Brain side will catch it during overwatch verification. From Armory's side, focus only on broken xrefs in IN-SCOPE files.

**Step 4.2 — Detect missing cross-references between related notes.**

For each pair of notes that share at least 3 tags AND have similarity above threshold (their "Key Takeaways" sections share 30%+ of nontrivial tokens), check if either note links to the other via `[[wiki-link]]` or markdown link. If neither links to the other → missing_xref finding.

This is intentionally noisy — not every related note needs to be linked. Apply confidence 0.60 (at floor) and let scoring deprioritize.

**Step 4.3 — Construct findings.**

```yaml
finding_id: "f-{today}-{seq}"
type: missing_xref
confidence: {0.85 for broken wiki link, 0.60 for noteless related pair}
primary_file: {the file containing the broken or missing reference}
secondary_file: {the target file, or null for broken-link cases}
primary_excerpt: {the line containing the wiki link or the related-note key claim, max 200 chars}
secondary_excerpt: {the related-note line, or null}
proposed_action_type: add_xref (for missing pair) | update (for broken link — fix or remove)
proposed_action: "Add `[[{target-name}]]` reference to {primary_file} in the relevant section, OR remove the broken link if {target-name} no longer applies."
timeline_flag: false
verification_query: "Re-read {primary_file}. If {target-name} is still referenced and the target file does not exist, finding is VERIFIED. For missing-xref pairs: re-check that the two files still cover the same topic and neither links to the other."
risk_level: low (cross-reference additions are non-destructive)
reversible: true
```

**Cap:** Maximum 2 missing_xref findings per cycle (low type_priority, easily noisy).

### Check 5: unintegrated (confidence floor 0.6, type_priority 2)

**Goal:** Detect high-relevance notes whose key claims never made it into any cheatsheet or operational doc. The "great note, never acted on" pattern. This is the LEARN-VERIFY-IMPLEMENT-REPLACE pipeline's failure mode: knowledge gets ingested but never integrated into how we work.

**Step 5.1 — Filter to high-relevance notes only.**

Glob `~/Projects/_brain/Armory/Notes/*.md`. For each note, read the frontmatter `relevance_score` field. Keep only notes with `relevance_score >= 4`. Lower-relevance notes are not expected to be integrated; they're queryable knowledge, not actionable knowledge.

**Step 5.2 — Extract key claims from each high-relevance note.**

For each kept note, read:
- The "Actionable for Your Projects" section (this is the primary signal — the ingest pipeline already pre-extracted what should be acted on)
- The "Key Takeaways" section (secondary signal)
- The frontmatter `tags` field (tertiary signal — for fuzzy matching)

Extract concrete tool names, technique names, and configuration values mentioned. Build a key-claims set per note.

**Step 5.3 — Search cheatsheets for those claims.**

For each note's key-claims set, search `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` for any mention of the claim's key tokens. Currently System-Manifest is the only cheatsheet, but the search should be glob-based to handle future cheatsheets.

**CRITICAL — System-Manifest has TWO version surfaces.** Read the ENTIRE file before deciding a version/changelog note is unintegrated:

1. **Static early-feature table** (near the top, around lines 165–180 as of 2026-06-22): covers v2.1.110-era foundational features. Stable, rarely updated. A v2.1.176+ note absent from this table is EXPECTED and is NOT an unintegrated finding.
2. **Rolling carry-forward table** (further down, around lines 210–220 as of 2026-06-22): covers current-running CC versions (e.g., "Claude Code v2.1.178–2.1.181 (June 15–17)"). Updated as new versions ship. THIS is where modern version notes should be cited.

When checking a version/changelog note (filename contains a CC version, e.g., `2026-06-18_claude-code-v2-1-176-181-changelog.md`):
- Grep the ENTIRE System-Manifest for the version range AND the note's filename.
- If the note's filename appears in EITHER surface → integrated, no finding.
- If the version range appears in the carry-forward table without the note filename → partial (downgrade confidence by 0.2, propose: add the note citation).
- Only emit `unintegrated` if NEITHER surface mentions the version range OR the note filename.

**False-positive Brain caught 2026-06-19:** the audit flagged `2026-06-18_claude-code-v2-1-176-181-changelog.md` as unintegrated because it only checked the static table (lines 165–174) and missed the carry-forward table line 211 that cites the note verbatim. This rule prevents the recurrence.

If at least 50% of the note's key claims are referenced somewhere in the cheatsheet (either surface) → **noted**, but continue to Step 5.3b.
If less than 50% → unintegrated finding (confidence 0.80, proposed_action: add to cheatsheet).

**Step 5.3b — Adoption-state awareness (NOTED vs IMPLEMENTED).**

Being referenced in a cheatsheet means "we wrote it down." It does NOT mean "we use it." The Armory philosophy (per CLAUDE.md) is: knowledge that doesn't change behavior is waste. A high-relevance note can be cheatsheet-listed and still unintegrated in practice.

For each note whose claims ARE in the cheatsheet (passed Step 5.3), perform the adoption probe:

1. Extract a short list of adoption signals from the note's "Actionable for Your Projects" section — concrete artifacts that would exist if the claim were in use. Examples:
   - A named daemon → expect a `.plist` in `~/Library/LaunchAgents/`
   - An MCP server → expect an entry in `~/.claude.json` or `~/.mcp.json`
   - A Claude Code skill → expect a directory under `~/.claude/skills/`
   - A settings.json key → expect the key in `~/.claude/settings.json`
   - A script/tool → expect a file under `~/Projects/{project}/scripts/` or `~/.local/bin/`
   - A CLAUDE.md instruction → expect the phrase in a `CLAUDE.md` somewhere

2. Check each signal exists. Use `Glob` for file paths, `Grep` for file contents. Do NOT read Brain's primary sources (Dashboard, Lessons, etc) — use cheatsheets, manifests, scripts, settings.

3. Compute adoption ratio: `signals_found / signals_checked`.

4. If ratio < 0.5, emit an `unintegrated` finding with:
   - Confidence 0.75 (lower than un-noted case because listing in cheatsheet is partial adoption)
   - `proposed_action_type: escalate` (maintainer decides: implement for real, or prune from cheatsheet as aspirational)
   - `proposed_action: "Note '{title}' (relevance {N}) is listed in the cheatsheet but adoption evidence is thin ({found}/{checked} signals present). Decide: implement the remaining signals, or prune the cheatsheet entry as aspirational."`
   - Include the missing-signal list in `primary_excerpt`

5. If ratio ≥ 0.5 and Step 5.3 passed → integrated, no finding.

This is the "noted vs implemented" distinction. Without it, Check 5 would rubber-stamp cheatsheet drift in which we *talk* about a tool but never actually use it.

**Step 5.4 — Construct findings.**

```yaml
finding_id: "f-{today}-{seq}"
type: unintegrated
confidence: {0.80 if 0% of claims integrated, 0.70 if 1-49% integrated}
primary_file: {the high-relevance note that hasn't been integrated}
secondary_file: {System-Manifest.md — the cheatsheet that should reference it}
primary_excerpt: {a representative key claim from the note, max 200 chars}
secondary_excerpt: null (the absence is the finding)
proposed_action_type: update (add the unintegrated claims to the cheatsheet)
proposed_action: "High-relevance note '{note title}' (relevance_score={N}) has key claims about {tools/techniques} that are not referenced in System-Manifest. Add a row or section to System-Manifest documenting these capabilities."
timeline_flag: false
verification_query: "Re-read {primary_file} frontmatter and confirm relevance_score >= 4. Search System-Manifest.md for the key tokens {token list}. If <50% of tokens appear in the manifest, finding is VERIFIED."
risk_level: low (cheatsheet additions are non-destructive)
reversible: true
```

**Cap:** Maximum 3 unintegrated findings per cycle (this category often has a long tail).

**Concrete known target for validation:** Any note from the past 2 weeks with `relevance_score: 5` or `relevance_score: 4` whose key tools (e.g., Pinecone, claude-mem, Letta, Mem Palace, RAG-Anything) do not appear in `System-Manifest.md` should surface as an unintegrated finding.

### Check 6: source_drift (confidence floor 0.7, type_priority 4) ← HIGHEST VALUE

**Goal:** Detect when the same factual claim is stated differently in two authoritative locations within scope. This is the highest-priority check because contradictions between operational docs and ingested knowledge degrade the brain silently.

**Step 6.1 — Extract authoritative claims from operational docs.**

Read these files in order and pull out concrete factual claims (not opinions, not aspirations):

1. `~/Projects/_brain/Almost-Done.md` — extract every line item with a status indicator: `RED`/`YELLOW`/`GREEN`, percentage completes, strikethrough (`~~text~~` = marked DONE), bullet point statuses. Each line is one claim. Note the line number for the verification_query.

2. `~/Projects/_brain/Tool-Stack.md` — extract every claim about which specific tool is used by which project. Format: `(project, category, tool_name, version_if_specified)`. E.g., `(my-project, auth, SomeAuthLib, latest)`, `(Armory, runtime, Node.js, "latest")`.

3. Per-project MASTER_CONTEXT files at `~/Projects/{project-1,project-2,...}/docs/context/MASTER_CONTEXT.md` _(your project list)_ — extract claims under sections named "What's Built", "Live Systems", "Status", "Phase", "Current". Skip prose; capture concrete state declarations only.

For each extracted claim, hold: `(source_file, source_line_number, claim_text, claim_category, claim_value)` where category ∈ {status, tool_use, version, phase, daemon, configuration, percent_complete, in_progress}.

**Step 6.2 — For each claim, search Notes and Cheatsheets for the same fact.**

Use Glob + Grep to search:
- `~/Projects/_brain/Armory/Notes/*.md` for the claim's key tokens (tool names, version numbers, phase names)
- `~/Projects/_brain/Armory/Cheatsheets/*.md` (currently just `System-Manifest.md`) for the same

For each match, read the surrounding context (5 lines before/after) to determine what THAT file claims about the same fact.

**Step 6.3 — Compare and emit findings.**

For each operational claim that has at least one match in Notes or Cheatsheets:
- If the values match → no finding (the system agrees with itself)
- If the values disagree → emit a `source_drift` finding with confidence based on:
  - Direct numeric/value contradiction (e.g., "0%" vs "LIVE", or "v1.2" vs "v2.0"): confidence 0.85
  - Status word contradiction (e.g., "in progress" vs "complete", "planned" vs "live"): confidence 0.80
  - Category mismatch (e.g., a tool is named in different categories across files): confidence 0.70
  - Soft semantic disagreement (paraphrased but possibly equivalent): confidence 0.60 → drops below floor, do not emit

Set `timeline_flag: true` if file modification dates suggest one file may simply be more recent than the other (one might be stale, not contradicted).

**Step 6.4 — Construct the Finding.**

For each source_drift finding, fill the schema fields:

```yaml
finding_id: "f-{today}-{seq}"
type: source_drift
confidence: {0.70-0.85 per Step 6.3}
primary_file: {operational doc — Almost-Done.md, Tool-Stack.md, or a MASTER_CONTEXT.md}
secondary_file: {the Note or Cheatsheet that disagrees}
primary_excerpt: {the exact line from primary_file, max 200 chars}
secondary_excerpt: {the exact disagreeing line from secondary_file, max 200 chars}
proposed_action_type: {usually "update" — pick the more recent / more detailed source as canonical and update the other}
proposed_action: "Update {file} line {N}: replace '{old text}' with '{new text}' to match {other file}. Reason: {one sentence}."
timeline_flag: {true if dates suggest supersession}
verification_query: "Open {primary_file} line {N} and {secondary_file} section '{section_heading}'. If the two values still disagree as of today's date, this finding is VERIFIED. If the operational doc has been updated since this audit, mark DISPUTED(stale-finding)."
risk_level: {medium for status/percentage updates, low for tool name corrections, high for changes that cascade to multiple files}
reversible: true
```

**Concrete known target for validation:**

`Almost-Done.md` may contain a line describing a feature as `0%`/RED while Armory Notes or System-Manifest.md describe the same feature as LIVE. If found, emit a high-confidence source_drift finding. Brain will verify by reading Dashboard.md (which it has access to and Armory does not).

**Other expected targets on first run:**

- `Tool-Stack.md` mentions project-stack libs (Better-Auth, Zustand, TanStack Query, Vite, GRDB, Leaflet, openpyxl). These are **out-of-Armory-scope per 2026-06-23 Brain ruling** — accepted-no-note. They are filtered by Check 7's Step 7.1.5 and MUST NOT surface as coverage_gap OR source_drift.
- `Almost-Done.md` strikethrough lines that should have been deleted per its own rules — these are `stale_entry` (Check 2), not source_drift.

Do not emit source_drift findings for cases that belong to other check types. Each check has a clear domain.

### Check 7: coverage_gap (confidence floor 0.6, type_priority 1)

**Goal:** Detect tools, techniques, and topics that are mentioned in operational docs (Tool-Stack, cheatsheets) but have no supporting Armory note explaining what they are or how they work. Also catches concepts that come up repeatedly in lessons or investigations but never got an authoritative note.

**Step 7.1 — Build the operational topics list.**

Read:
- `~/Projects/_brain/Tool-Stack.md` — extract every tool name explicitly listed
- `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` — extract every named entry (tool, daemon, plugin, MCP server, skill)
- `~/Projects/_brain/Armory/Investigations/*.md` — extract repeating topic mentions (any topic that appears in 3+ investigation reports)

Build a deduplicated set of "operational topics" — concepts that the system actively uses or repeatedly investigates.

**Step 7.1.5 — Filter out project-stack libs (per 2026-06-23 Brain ruling).**

Project-stack libs — runtime dependencies of the maintainer's projects listed in `~/Projects/_brain/Tool-Stack.md` under the per-project Languages & Platforms table — are **OUT-OF-ARMORY-SCOPE**. Armory's scope is curated external discoveries (videos, articles, repos, techniques), not documentation of our package manifests. These libraries are **accepted-no-note** and MUST NOT emit `coverage_gap` findings.

Excluded names (non-exhaustive; check `Tool-Stack.md` annotation as the source of authority):
- Package dependencies listed in your projects' `Tool-Stack.md` under "Languages & Platforms" (e.g. React, Express, SwiftUI, openpyxl, etc.)
- These are internal package manifest entries, not curated external Armory discoveries — they belong to your projects, not the Armory knowledge base.

Drop these names from the operational-topics set built in 7.1 BEFORE doing the coverage check in 7.2. Read the annotation at the bottom of the Languages & Platforms table in `Tool-Stack.md`; if the annotation has been deleted (the rule is reversible by design), reinstate Step 7.1.5 as a no-op and proceed normally.

`coverage_gap` IS still valid for genuinely-external knowledge — a technique, MCP, plugin, or tool we use (and discovered from an external source) but never captured a note for. Named app dependencies are the only excluded class.

This rule retired the single most frequent recurring audit finding (re-surfaced every cycle since 2026-05-26). Reference: Brain inbox-armory 2026-06-23 ruling.

**Step 7.2 — Check coverage in Notes.**

For each remaining operational topic (after 7.1.5 filtering), search `~/Projects/_brain/Armory/Notes/*.md` for any note whose title, frontmatter aliases, or first paragraph mentions the topic. Use case-insensitive matching with reasonable token overlap.

- If at least one note clearly covers the topic → covered
- If a note mentions the topic in passing but isn't focused on it → partial coverage (downgrade confidence by 0.2)
- If no note mentions the topic → coverage_gap finding

**Step 7.3 — Construct findings.**

```yaml
finding_id: "f-{today}-{seq}"
type: coverage_gap
confidence: {0.75 if topic is mentioned in 5+ operational places with no note, 0.65 if 3-4 places, 0.60 if 2-3 places (at floor)}
primary_file: {the most prominent operational doc mentioning the topic — usually Tool-Stack.md or System-Manifest.md}
secondary_file: null (the absence of a note IS the finding)
primary_excerpt: {the line in the operational doc mentioning the uncovered topic, max 200 chars}
secondary_excerpt: null
proposed_action_type: escalate (creating a new note is a maintainer decision — what depth, what category)
proposed_action: "Topic '{topic}' is referenced in {N} operational locations ({list 2-3 examples}) but no Armory note covers it. Ingest a note explaining what it is, why we use it, and how it integrates."
timeline_flag: false
verification_query: "Glob ~/Projects/_brain/Armory/Notes/*.md and grep -l '{topic}'. If zero results AND {topic} still appears in {primary_file} line {N}, finding is VERIFIED. If a note has been added since this audit, mark DISPUTED(stale-finding)."
risk_level: low (creating a new note is non-destructive)
reversible: true
```

**Cap:** Maximum 2 coverage_gap findings per cycle (these are informational and require maintainer judgment).

**Concrete known targets for validation (UPDATED 2026-06-23 per app-stack ruling):**

The original validation target — "Tool-Stack mentions Better-Auth, Zustand, TanStack Query, Vite, GRDB, Leaflet, openpyxl as actively-used tools with zero Armory notes; at least 2-3 MUST surface as coverage_gap" — is now **INVERTED**. Per Step 7.1.5, these are exactly the project-stack libs declared accepted-no-note by Brain's 2026-06-23 ruling. They MUST NOT surface as coverage_gap findings on first run.

**New validation target:** an Armory note refers to an external technique (e.g., a specific Karpathy pattern, a named workflow from a recent video) by name N+ times across notes but no canonical Armory note exists for it. THAT kind of gap is valid coverage_gap signal. App dependencies are not.

If a run surfaces package dependencies from `Tool-Stack.md` as coverage_gap, Step 7.1.5 isn't filtering correctly — fix the filter, do not "suppress" the finding downstream.

---

## Step 3: Finding Schema (8 Fields — Contract With Brain)

Every finding emitted by this skill MUST conform to this schema. Brain's `/overwatch-review` skill verifies findings using the `verification_query` field — without it, Brain cannot independently evaluate without re-reading everything this skill read, which defeats dual-review.

```yaml
finding_id:           "f-YYYY-MM-DD-NNN"   # auto-incremented per cycle
type:                 contradiction | stale_entry | redundant_coverage | missing_xref | unintegrated | source_drift | coverage_gap
confidence:           0.0-1.0               # float, this skill's self-assessed certainty
primary_file:         "/absolute/path"      # the file the finding is about
secondary_file:       "/absolute/path|null" # second file (only for contradiction/redundant/source_drift)
primary_excerpt:      "max 200 chars"       # the exact text that triggered the finding
secondary_excerpt:    "max 200 chars|null"  # the conflicting text in secondary_file
proposed_action_type: update | prune | add_xref | merge | escalate
proposed_action:      "human-readable description"  # what Brain should do if VERIFIED
timeline_flag:        true|false            # set true if this MIGHT be supersession rather than conflict
verification_query:   "instructions for Brain"      # CRITICAL — see below
risk_level:           low | medium | high
reversible:           true|false            # false = require git commit before applying
```

### Why `verification_query` Is Non-Negotiable

Without it, Brain has to re-read every file this skill read to form an independent opinion, which doubles token cost AND defeats dual-review (Brain becomes a rubber stamp). `verification_query` tells Brain WHERE to look, not WHAT to conclude. Brain executes the query and draws its own verdict.

**Good `verification_query` examples:**
- "Check `_brain/Almost-Done.md` line containing 'Data ingestion'. If it still says 0% AND `_brain/Dashboard.md` Session log mentions ingestion as LIVE, finding is VERIFIED."
- "Open `_brain/Armory/Notes/2026-04-07_token-optimization.md` and `_brain/Armory/Cheatsheets/System-Manifest.md`. If the Notes file states a different autoCompact threshold than the cheatsheet, finding is VERIFIED."
- "Search `_brain/Armory/Notes/` for any note other than `2026-04-03_top-4-mcp-servers-mobile-app-vibe-coding.md` or `2026-04-03_top-4-mcp-servers-vibe-coding-mobile-app.md` covering 'top mobile MCP servers'. If only those 2-3 files exist, this is a redundant cluster, VERIFIED."

**Bad `verification_query` examples:**
- "Check if these files contradict." (too vague)
- "Verify this finding." (no instructions)
- "Read everything again and decide." (defeats the purpose)

### Risk Level Guidance

- **low**: cross-reference addition, comment update, frontmatter field added, structural fixes (missing LESSONS.md template)
- **medium**: cheatsheet entry update, single note prune (where supersession is clear), wiki link repair
- **high**: merge of notes (destructive), fact change in `Tool-Stack.md` or `Almost-Done.md`, anything that touches multiple files atomically

### Reversibility Rule

Set `reversible: false` for any action that cannot be cleanly undone with a git revert — for example, merging two notes into one (the originals are gone), or pruning a note that other notes reference. Brain MUST git-commit before applying non-reversible actions, and any high-risk OR non-reversible finding is automatically routed to NEEDS-CHRIS regardless of test outcomes.

---

## Step 4: Score and Filter to Top-5

**Procedure.** Apply pre-scoring filters then the scoring formula then the dedupe pass.

**Pre-scoring filters (drop entirely):**
- `confidence < 0.4` → drop
- coverage_gap with partial existing note → downgrade confidence by 0.2 before scoring
- Same `primary_file` already represented → keep only the highest-scoring finding for that file (one finding per file, worst wins). **Exception for `coverage_gap` type:** key dedupe by `(primary_file, topic)` instead of just `primary_file`, because a single file (e.g., Tool-Stack.md) can contain many independent missing-tool gaps that each deserve separate surfacing. Without this carve-out, all Tool-Stack gaps collapse into one finding.

**Scoring formula:**
```
score = confidence × risk_weight × type_priority

risk_weight:   high=3, medium=2, low=1
type_priority: contradiction=5, source_drift=4, stale_entry=3,
               coverage_gap=3, unintegrated=2, redundant=1, missing_xref=1
```

**After scoring:** sort descending by score. Take top 5. Everything else goes into a "Skipped Findings" section in the report (preserved for posterity but not surfaced to Brain or the maintainer).

---

## Step 5: Write Audit Report

**Procedure.** Write to `~/Projects/_brain/Armory/AuditReports/YYYY-MM-DD_internal-audit.md` using today's actual date. Use this structure:

```markdown
---
audit_date: YYYY-MM-DD
total_findings: N
surfaced: 5
skipped: M
confidence_distribution: {high: X, medium: Y, low: Z}
checks_run: [contradiction, stale_entry, ...]
audit_output: true
---

# Internal Audit Report — YYYY-MM-DD

## Summary
- Total findings: N (5 surfaced for Brain review, M skipped below threshold)
- Run timestamp: ISO-8601
- Files scanned: count
- Score range surfaced: lowest to highest

## Finding 1 of 5
**ID:** f-YYYY-MM-DD-001
**Type:** {check_type}
**Confidence:** 0.XX
**Risk:** {low|medium|high}
**Reversible:** {true|false}

**Primary file:** `path`
**Primary excerpt:**
> {≤200 char excerpt}

**Secondary file:** `path` (only if applicable)
**Secondary excerpt:**
> {≤200 char excerpt}

**Proposed action:** ({update|prune|add_xref|merge|escalate})
{human-readable description}

**Timeline flag:** {true|false}

**Verification query for Brain:**
> {specific instructions Brain should follow to independently verify}

---

## Finding 2 of 5
[... same structure ...]

## Skipped Findings (Below Top-5)
The following M additional findings scored below the top-5 cutoff. Listed for posterity:
- f-YYYY-MM-DD-006: {type} in {primary_file} (score: 1.4)
- ...
```

The `audit_output: true` frontmatter is the recursive-drift safeguard — future audit runs MUST exclude any file with this field.

---

## Step 6: Send Nerve Center Message to Brain

**Procedure.** Append a message to `~/Projects/_brain/Comms/inbox-brain.md` using EXACTLY this format. The header MUST start with two hashes (`## From Armory`) — three hashes will not be detected by the watcher's regex (`^## From`).

```markdown
## From Armory — YYYY-MM-DD HH:MM (internal audit complete)

Internal audit cycle complete. {N} findings total, 5 surfaced for Overwatch review.

Report: `_brain/Armory/AuditReports/YYYY-MM-DD_internal-audit.md`

Findings by type:
- contradiction: {n}
- source_drift: {n}
- stale_entry: {n}
- unintegrated: {n}
- redundant_coverage: {n}
- missing_xref: {n}
- coverage_gap: {n}

Action needed: run `/overwatch-review` against the latest audit report. For each finding:
1. Execute the verification_query independently
2. Run the 5-test verification ladder (existence → query → timeline → operational context → risk gate)
3. Mark VERIFIED / DISPUTED / NEEDS-CHRIS
4. Apply VERIFIED low/medium-risk fixes
5. Kick back DISPUTED reasoning to inbox-armory.md
6. Escalate NEEDS-CHRIS via iMessage at end of cycle

---
```

Use 24-hour time. Use the exact date format `YYYY-MM-DD HH:MM`. Append the message after the `## Unprocessed` heading (if present) or after the most recent unprocessed message. Do NOT touch the `## Processed` section.

After writing the message, verify the watcher will pick it up by checking that the file write succeeded:
```bash
grep -c "^## From Armory.*internal audit complete" ~/Projects/_brain/Comms/inbox-brain.md
```
Should return a count >= 1.

The watcher (`com.starter.nerve-center-watcher`) polls every ~10s and watches for file writes to `_brain/Comms/`. Within 30s of the message landing, it should spawn a Brain-context Sonnet session that processes the inbox.

---

## Step 7: Send iMessage Summary to Maintainer

**Procedure.** Reuse the existing `imessage-send.sh` script:

```bash
bash ~/Projects/Armory/scripts/imessage-send.sh '<message>'
```

Message format (keep under 500 chars, no markdown — iMessage strips it):

```
Armory Internal Audit YYYY-MM-DD: N findings, 5 surfaced for Brain review.
Top finding: {type} in {basename of primary_file}.
Confidence range: {low}-{high}.
Report: _brain/Armory/AuditReports/YYYY-MM-DD_internal-audit.md
Brain Overwatch will verify and apply fixes; you'll get a follow-up summary when the cycle completes.
```

If no findings cleared the floor (genuinely clean audit), the message should say so clearly: "Armory Internal Audit YYYY-MM-DD: clean. {N} potential findings checked, all below confidence floor."

---

## Step 8: Report to Terminal

Print to stdout:
- Audit completed for date YYYY-MM-DD
- Files scanned, findings emitted, top-5 surfaced
- Path to the audit report
- Confirmation that the nerve center message was written and the iMessage was sent
- Any errors or check types that produced 0 findings (might indicate broken check logic)

If `--dry-run` was specified, print the full report to stdout instead of writing the file, and skip Steps 6 and 7 entirely.

---

## Step 9: Self-Grade Outcomes (graded re-check)

After the report is written (or printed, in `--dry-run`), do a brief grader pass on the run itself. This is a cheap quality gate, not a re-run — it catches noise-heavy or empty cycles before they reach Brain.

Score the run on three axes (1-5 each):
1. **Materiality** — Did the surfaced findings represent real drift Brain will act on, or restatements of already-escalated / decision-blocked items? (Re-surfacing a known pending finding scores low.)
2. **Coverage** — Did all 7 check types run, or did any silently produce 0 findings in a way that suggests broken check logic rather than a clean vault?
3. **Signal-to-noise** — Of the findings emitted (pre-top-5 filter), what fraction cleared their confidence floor on the first pass?

Emit a one-line grade block in the run header:
`GRADE: materiality M/5 · coverage C/5 · signal D/5 — <one-sentence verdict>`

If materiality <= 2 (the cycle mostly re-surfaced known/pending findings), say so explicitly in the Nerve Center message so Brain can suppress rather than re-verify. A low-materiality run is a valid, useful outcome — do NOT invent findings to raise the score.

---

## Frontmatter Parsing Rules

Multiple checks read frontmatter (`tags`, `aliases`, `date_ingested`, `relevance_score`, `canonical`, `investigation_status`). Parse defensively — not every note has every field, and YAML edge cases lurk.

1. **Boundary.** Frontmatter starts at line 1 with `---`, ends at the next `---`. If the file does not start with `---` on line 1, treat it as having no frontmatter (empty map). Do NOT scan body text for `tags:` prefixes.
2. **Values that span multiple lines.** `tags:` and `aliases:` can be block-list form (`- foo` on following indented lines) OR inline-list form (`[foo, bar, baz]`). Handle both. A value missing entirely is an empty list, not an error.
3. **Numeric fields.** `relevance_score` is an integer 1-5. If missing, absent, or non-numeric, treat as `0` (never `null` — downstream comparisons like `>= 4` would throw). Same for `confidence_floor` if that field ever appears.
4. **Date fields.** `date_ingested` is `YYYY-MM-DD`. If missing or unparseable, fall back to the filename date prefix (`2026-04-14_` → `2026-04-14`). If the filename has no date prefix, treat the note as undated (oldest possible) to be conservative.
5. **Stray whitespace and BOM.** Trim keys and values. Strip any UTF-8 BOM before parsing.
6. **Duplicate keys.** If a note has `tags:` appearing twice (rare but happens when Obsidian merges frontmatter oddly), take the union of the values, not the last occurrence.
7. **Broken YAML.** If the frontmatter block is syntactically invalid (unclosed quote, tab mixed with spaces), log a warning in the run header ("note {basename} has unparseable frontmatter") and fall back to filename-only metadata for that note. Do NOT abort the whole audit.

When in doubt, a missing frontmatter field is not a bug in the file; it's a check that should fall through safely. Never emit a finding whose proximate cause is "frontmatter field X was missing" — that is a data-hygiene observation, not drift.

---

## Rules

- **NEVER modify any file other than the audit report and the inbox-brain.md message.** This skill is read-only by design. All proposed fixes go through Brain.
- **NEVER read files in the OUT-OF-SCOPE list** — those are Brain's primary sources, reserved for independent verification.
- **NEVER skip the verification_query field on any emitted finding.** A finding without a verification_query is not a valid finding.
- **NEVER auto-promote a finding to a higher risk_level than the action_type warrants.** A typo fix is `low`. A note merge is `high`. Don't sandbag.
- **Cap at 5 surfaced findings per cycle.** Top-5 filter is non-negotiable. Noise control matters more than completeness.
- **Use today's actual date**, not a placeholder.
- **Confidence floors are per-check**, not global. A 0.65 contradiction is below floor (drop). A 0.65 stale_entry is at floor (keep).
- **Recursive drift is the worst failure mode.** If you find yourself reading anything in `_brain/Armory/AuditReports/`, stop. That's audit output, not audit input.
- **Verification collusion is the second-worst failure mode.** If you find yourself reading any file in the OUT-OF-SCOPE list (Dashboard, Lessons, Cross-Project-Architecture, <maintainer-profile>, Decisions, SESSION_LOGs), stop. Those are Brain's eyes, not yours.
- **The braindump at `~/Projects/Ideas/Braindumps/2026-04-11_Armory-Overwatch-Audit-Architecture.md` is the canonical design doc.** Read it before making structural changes to this skill.
