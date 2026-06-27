#!/usr/bin/env python3
"""
armory-cost — per-session token & cost report from Claude Code JSONL transcripts.

No infrastructure required. Parses ~/.claude/projects/<slug>/*.jsonl session logs
(the same data the OpenTelemetry path would emit) and rolls up token usage and an
estimated dollar cost per session, per model, and in total.

This is the no-infra fallback documented in:
  _brain/Armory/Investigations/2026-05-26_inv_claude-code-opentelemetry-command-center.md
Upgrade path (Grafana/Prometheus via ColeMurray/claude-code-otel) is optional and
held pending the maintainer's decision — see the SKILL.md "Upgrade Path" section.

Usage:
  armory-cost.py                      # current Armory project, all sessions
  armory-cost.py --all                # every project under ~/.claude/projects
  armory-cost.py --project my-project   # match a project slug substring
  armory-cost.py --since 2026-05-01   # only files modified on/after this date
  armory-cost.py --top 10             # cap session rows shown (default 15)
"""
import argparse, glob, json, os, sys
from datetime import datetime, date

PROJECTS_DIR = os.path.expanduser("~/.claude/projects")

# Pricing in USD per 1M tokens. VERIFY against current Anthropic pricing before
# trusting absolute dollars — these are the published tiers as of early 2026 and
# are the single thing most likely to drift. Token COUNTS below are exact (from
# the transcript); only the $ multipliers are assumptions.
PRICING = {
    # tier:   input,  output, cache_write(5m), cache_read
    "opus":   (15.0,  75.0,   18.75,           1.50),
    "sonnet": (3.0,   15.0,   3.75,            0.30),
    "haiku":  (1.0,   5.0,    1.25,            0.10),
}

def tier_for(model: str) -> str:
    m = (model or "").lower()
    if "opus" in m: return "opus"
    if "sonnet" in m: return "sonnet"
    if "haiku" in m: return "haiku"
    return "opus"  # unknown model: cost-conservative (assume most expensive)

def cost(tier, inp, out, cw, cr) -> float:
    pi, po, pcw, pcr = PRICING[tier]
    return (inp*pi + out*po + cw*pcw + cr*pcr) / 1_000_000

def parse_file(path):
    """Return dict: model -> [in, out, cache_write, cache_read, n_msgs]."""
    agg = {}
    for line in open(path, errors="replace"):
        line = line.strip()
        if not line or '"usage"' not in line:
            continue
        try:
            d = json.loads(line)
        except Exception:
            continue
        msg = d.get("message")
        if not isinstance(msg, dict):
            continue
        u = msg.get("usage")
        if not isinstance(u, dict):
            continue
        model = msg.get("model") or d.get("model") or "unknown"
        a = agg.setdefault(model, [0, 0, 0, 0, 0])
        a[0] += u.get("input_tokens", 0) or 0
        a[1] += u.get("output_tokens", 0) or 0
        a[2] += u.get("cache_creation_input_tokens", 0) or 0
        a[3] += u.get("cache_read_input_tokens", 0) or 0
        a[4] += 1
    return agg

def fmt(n): return f"{n:,}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="scan every project")
    ap.add_argument("--project", default="Armory", help="project slug substring")
    ap.add_argument("--since", help="YYYY-MM-DD, filter by file mtime")
    ap.add_argument("--top", type=int, default=15)
    args = ap.parse_args()

    since = None
    if args.since:
        since = datetime.strptime(args.since, "%Y-%m-%d").date()

    pattern = os.path.join(PROJECTS_DIR, "*", "*.jsonl")
    files = []
    for f in glob.glob(pattern):
        slug = os.path.basename(os.path.dirname(f))
        if not args.all and args.project.lower() not in slug.lower():
            continue
        mtime = date.fromtimestamp(os.path.getmtime(f))
        if since and mtime < since:
            continue
        files.append((f, slug, mtime))

    if not files:
        print(f"No matching JSONL transcripts (scope: {'all' if args.all else args.project}).")
        return

    rows = []           # (mtime, slug, sessionid, model_agg)
    model_totals = {}   # tier -> [in,out,cw,cr,$]
    grand = [0, 0, 0, 0, 0.0]
    for f, slug, mtime in files:
        agg = parse_file(f)
        if not agg:
            continue
        sess = os.path.splitext(os.path.basename(f))[0][:8]
        srow = [0, 0, 0, 0, 0.0]  # in,out,cw,cr,$
        for model, (i, o, cw, cr, n) in agg.items():
            t = tier_for(model)
            c = cost(t, i, o, cw, cr)
            srow[0] += i; srow[1] += o; srow[2] += cw; srow[3] += cr; srow[4] += c
            mt = model_totals.setdefault(t, [0, 0, 0, 0, 0.0])
            mt[0]+=i; mt[1]+=o; mt[2]+=cw; mt[3]+=cr; mt[4]+=c
        for k in range(4): grand[k] += srow[k]
        grand[4] += srow[4]
        rows.append((mtime, slug, sess, srow))

    rows.sort(key=lambda r: r[3][4], reverse=True)  # by cost desc

    scope = "ALL projects" if args.all else f"project ~ '{args.project}'"
    print(f"# /armory-cost — token & estimated-cost report")
    print(f"_Scope: {scope}{' since '+args.since if args.since else ''} · "
          f"{len(rows)} sessions · source: JSONL transcripts (no telemetry infra)_\n")

    print("## Top sessions by estimated cost\n")
    print("| Date | Project | Session | Input | Output | Cache wr | Cache rd | Est $ |")
    print("|------|---------|---------|------:|-------:|---------:|---------:|------:|")
    for mtime, slug, sess, s in rows[:args.top]:
        proj = slug.split("-Projects-")[-1] if "-Projects-" in slug else slug
        print(f"| {mtime} | {proj[:18]} | {sess} | {fmt(s[0])} | {fmt(s[1])} | "
              f"{fmt(s[2])} | {fmt(s[3])} | ${s[4]:.2f} |")

    print("\n## By model tier\n")
    print("| Tier | Input | Output | Cache wr | Cache rd | Est $ |")
    print("|------|------:|-------:|---------:|---------:|------:|")
    for t, m in sorted(model_totals.items(), key=lambda kv: kv[1][4], reverse=True):
        print(f"| {t} | {fmt(m[0])} | {fmt(m[1])} | {fmt(m[2])} | {fmt(m[3])} | ${m[4]:.2f} |")

    print(f"\n## Total\n")
    print(f"- Input: **{fmt(grand[0])}** · Output: **{fmt(grand[1])}** · "
          f"Cache write: **{fmt(grand[2])}** · Cache read: **{fmt(grand[3])}**")
    print(f"- **Estimated cost: ${grand[4]:.2f}**  _(token counts exact; $ uses "
          f"published per-tier pricing — verify rates in PRICING dict)_")

if __name__ == "__main__":
    main()
