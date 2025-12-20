# CineQuest Future Ideas 💡

> Ideas to think about tomorrow - December 20, 2024

---

## 1. AI-Generated Trivia Content 🎯

**The Problem:** Manually writing trivia questions is tedious and the content gets stale.

**The Solution:**

- Create a script that pulls the **Top 10 Trending Movies** from TMDB API every 24 hours.
- Use **Gemini 3** to auto-generate 5 trivia questions per movie.
- This keeps the "Higher-Lower" game fresh without manual effort.

**Implementation Notes:**

- Could run as a Vercel Cron Job or GitHub Action.
- Store questions in a JSON file or database.
- Rotate questions weekly.

---

## 2. Monetization Strategy 💰

### Rewarded Ads (The "Ad-Gate" Strategy)

- **Trigger:** If a user can't decide after 3 "shuffles."
- **Reward:** Watch a Video Ad → Unlock "Premium Movie Suggestions" for 1 hour.
- This feels fair and valuable, not annoying.

### The $1.99 "Kill Switch" (One-Time Purchase)

- Integrate **RevenueCat** (or standard IAP) for a $1.99 one-time purchase.
- When purchased:
  - Globally disable the AdContainer component.
  - Unlock all Trivia levels.
  - Badge: "CineQuest Pro" 🏆

---

## 3. Differentiation Strategy (Critical) 🎭

**Reality Check:** Movie pickers are a crowded market. A simple randomizer is replaceable.

### The "Mood Picker" Feature (High Value)

Instead of genre buttons, let users type natural language:

> "I want a movie that feels like a warm hug but won't make me cry in front of my date."

This is what people would **pay $1.99 for** — the AI understands _vibes_, not just genres.

**Note:** We already have VibeCoder doing something similar. Could enhance this.

---

## 4. Games → Recommendations Loop 🔄

**The Trap:** Don't let trivia become a separate app. It should drive engagement.

**The Play:**

- "You got 5/5 on Horror Trivia! You're a pro—you should watch **[Niche Horror Movie]** tonight."
- Use quiz performance to personalize spin results.
- Trivia correct answers = Movie recommendations.

---

## Priority Order

| #   | Idea                    | Effort | Impact    |
| --- | ----------------------- | ------ | --------- |
| 1   | Mood Picker Enhancement | Medium | High ⭐   |
| 2   | Games → Recommendations | Low    | Medium    |
| 3   | AI Trivia Generation    | Medium | Medium    |
| 4   | Rewarded Ads            | Medium | $ Revenue |
| 5   | $1.99 Pro Upgrade       | High   | $ Revenue |

---

_Let's discuss tomorrow!_
