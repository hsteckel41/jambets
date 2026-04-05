# JamBets2 — TODOs

## Post-Settlement Peer Reviews

**What:** After a market settles (both parties submit matching results), each user gets a prompt to rate their opponent and leave a short review. E.g., thumbs up/down + one sentence. Reviews are public on the opponent's `/u/[username]` profile.

**Why:** Reputation based on peer reviews is more trustworthy than an algorithmic score. A user with 20 "paid immediately, no drama" reviews is credibly safe to bet with. An auto-computed score from a formula is easy to game.

**Pros:** Social accountability. Feed browsers can check a creator's rep before accepting a bet. Surfaces bad actors fast.

**Cons:** Adds a new UI step post-settlement (could feel like friction). Requires a new `Review` model. Some users will skip the review prompt.

**Context:** User decision in V2 plan review: reputationScore should be review-based, not auto-computed. For V2, the profile page shows `User.reputationScore` as-is (static default 100) with a note that reviews are coming. This feature is the proper replacement.

**Schema needed:**
```
model Review {
  id          String   @id @default(cuid())
  fromUserId  String
  toUserId    String
  betId       String   @unique
  rating      Boolean  // thumbs up/down
  text        String?  @db.VarChar(140)
  createdAt   DateTime @default(now())
}
```

**Depends on:** V2 settlement flow shipped first. No other blockers.

---

## Tease Rulebook / Convention Guide

**Status:** Partially addressed by V2 Rules field (see plan-v2.md §5). The Rules text field with its placeholder ("Does a tease count? What if the song segues out?") now prompts creators to specify edge cases inline. The remaining enhancement is a floating "tease rulebook" help reference — a "What counts?" link near the Rules input that opens a short guide (tease = partial melody, segue = full transition, etc.).

**What:** Add a "What counts?" help link near the Rules field in the create market form that opens a short community-standard guide for common jam band rulings.

**Why:** The Rules field nudges creators to specify edge cases, but new users may not know what the common edge cases are. The rulebook surfaces that knowledge proactively.

**Pros:** Reduces dispute rate further. Educates new users. Gives experienced users a shortcut ("standard tease rules apply").

**Cons:** Adds UX complexity. Could feel over-engineered if the Rules field placeholder already does the job.

**Context:** This came up during office hours — the user immediately named "teases" and "song segues" as edge cases they've personally argued about in group chats. Dispute rate target is under 20%.

**Depends on:** V2 Rules field shipped first. No other blockers.
