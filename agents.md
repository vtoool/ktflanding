## xPrompt — Operator Notes (keep short & practical)

**Context Snapshot (TL;DR)**  
- What this repo/app does in one paragraph.  
- Current goal of latest changes (1–3 bullets).

**Re-prompt Triggers**  
- When outputs deviate from spec, restate acceptance criteria and re-ask.  
- If the tool starts deleting unrelated code, instruct: “Surgical edits only. No broad deletions.”  
- If visual parity breaks, prompt: “Match existing tokens, spacing, and dark/light behavior.”

**Change Log (Micro-summaries)**  
- [YYYY-MM-DD] One-line summary of what changed and why.  
- [YYYY-MM-DD] …

**Known Pitfalls**  
- Over-eager refactors (keep scope tight).  
- Icon color contrasts in dark mode.  
- Clipboard wrap: preserve *I formatting while enabling wrap.

**Could Be Easier Next Time**  
- Centralize icon primitives (check, copy) with tokens.  
- Single source of truth for brand colors and radii.

**QA Checklist (paste into PR)**  
- [ ] 4 icons are white checkmarks on blue, matching *I pressed style.  
- [ ] Pressing *I copies text, **no “Copied” pill** shows.  
- [ ] Clipboard simulator has no horizontal scroll at 1280×800 and 1536×864.  
- [ ] Brand reads “FareSnap” everywhere in UI; logo is inline SVG; dark/light OK.  
- [ ] No unrelated files changed; build passes; a11y labels intact.
