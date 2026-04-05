# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools directly.

Available gstack skills:
- `/office-hours` — async office hours / Q&A session
- `/plan-ceo-review` — CEO review of a plan
- `/plan-eng-review` — engineering review of a plan
- `/plan-design-review` — design review of a plan
- `/design-consultation` — design consultation
- `/review` — code review
- `/ship` — ship a change
- `/land-and-deploy` — land and deploy
- `/canary` — canary deploy
- `/benchmark` — run benchmarks
- `/browse` — web browsing (use this for ALL web browsing)
- `/qa` — QA a change
- `/qa-only` — QA only (no deploy)
- `/design-review` — design review
- `/setup-browser-cookies` — set up browser cookies
- `/setup-deploy` — set up deploy configuration
- `/retro` — retrospective
- `/investigate` — investigate an issue
- `/document-release` — document a release
- `/codex` — codex
- `/cso` — CSO review
- `/autoplan` — automatically plan a task
- `/careful` — careful mode
- `/freeze` — freeze deploys
- `/guard` — guard mode
- `/unfreeze` — unfreeze deploys
- `/gstack-upgrade` — upgrade gstack

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, border-radius, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key tokens to remember:
- Primary accent: `#7C3AED` (violet)
- Secondary: `#10B981` (emerald)
- Background: `#0C0A07` (warm near-black)
- Text: `#EDE7D4` (cream)
- Display font: Fraunces italic
- Body font: DM Sans
- Data/mono font: Geist Mono
