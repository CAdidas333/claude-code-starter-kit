---
title: Vertical Slices Beat Horizontal Layers
source: Claude Code Starter Kit seed note
ingested: 2026-04-10
topics: [software-design, workflow, architecture]
related_projects: []
---

# Vertical Slices Beat Horizontal Layers

## Key Insight

**Build one complete end-to-end slice of your feature before building the next one.** Don't build the whole database layer first, then the whole API layer, then the whole UI layer. That's horizontal. It's also the single most common way to ship nothing.

## The horizontal trap

You're building a habit tracker. The "obvious" plan:

1. Week 1: design the whole database schema
2. Week 2: build all the API endpoints
3. Week 3: build the UI for all the pages
4. Week 4: wire everything up

This feels organized. It feels efficient. It's a disaster. Here's why:

- **Nothing works until Week 4.** For 21 days, you have no working software. You can't demo. You can't test. You can't get feedback. You can't catch misunderstandings about what the thing should do.
- **Every week's work is decisions you can't verify.** You designed the database without knowing what the UI actually needs to render. You built endpoints without a real consumer. You built UI against an API that might be wrong.
- **When you finally wire it all up, the integration work reveals that the whole plan was slightly wrong.** Now you have four weeks of work to refactor, and you've shipped nothing yet.

## The vertical alternative

Same habit tracker. Vertical slices:

1. **Slice 1: "I can add a habit."** Crappy UI, simple API, minimal DB schema. Takes a day. IT WORKS END-TO-END. You can demo it.
2. **Slice 2: "I can mark a habit done today."** Extend the schema, add an endpoint, add a button. Another day. IT WORKS.
3. **Slice 3: "I can see my streak."** Add streak calculation to the API, add a display. Another day. IT WORKS.

After Slice 1, you have working software. You can show someone and watch their face. You can use it yourself and notice "oh, I want a delete button." You can catch misunderstandings while they're cheap.

After Slice 3, you still have working software, and you've learned three things about the real design by actually using it.

## How to apply it in Claude Code

When you're planning a feature (in Plan Mode — see the plan-mode-first note), tell Claude:

> "Break this into vertical slices. Slice 1 is the smallest thing that works end-to-end — DB, API, and UI all minimally present. Don't build all the DB changes first."

Claude defaults to horizontal plans because they look more organized on paper. You have to explicitly ask for vertical.

## When horizontal is actually right

Rarely, but it happens:
- **You're replacing a layer with a direct equivalent.** E.g., swapping one database for another with the same schema. The scope is naturally horizontal.
- **The layers are in separate repos owned by separate teams.** You're coordinating an interface change across boundaries, and each team owns their layer.

For everything else — especially solo work — vertical. Always vertical.

## The superpower

Vertical slices force you to confront the real design earlier. You can't hide behind "we'll figure out the UI later" because the UI is part of every slice. You can't hide behind "the API is well-designed" because every slice is a customer of the API and reveals whether it actually is.

Vertical slices = continuous reality checks. Horizontal layers = delayed reality checks. Reality always wins; the only question is whether you meet it early or late.

## Related

- `plan-mode-first` (seed note) — Plan Mode is where you tell Claude to choose vertical over horizontal
- `/new-project` — bootstraps a project with vertical slicing built into the default workflow
