# Questly ⚔️

A gamified, real-time, mobile-first web app for **shared todo lists** ("quests"). Lists are
*quests*, todos are *objectives*, buy/reference links are *loot links*, members are the *party*.
Completing objectives earns XP, levels, streaks, and badges — a co-op layer over a solid todo app.

## Stack

- **Rails 8.1** (full app, not API-only) · PostgreSQL · **Solid Queue / Solid Cable / Solid Cache** (no Redis)
- **React 18 + TypeScript**, bundled by **Shakapacker + webpack + swc**, mounted in one Rails view
- **ActionCable** for real-time, authenticated by the Rails session cookie (same origin, no JWT, no CORS)
- **TanStack Query** (server cache) · React Router · Tailwind · Framer Motion · canvas-confetti · Alba (serializers)

> The spec called for rspack; Shakapacker's stable line doesn't support it, so we use **swc** (equivalent
> speed). See `docs/BUILD_PLAN.md` for the full decision log.

## Architecture

One app, one origin. A single Rails controller (`AppController#index`) renders an HTML shell with
`<div id="questly-root">`; React boots into it and owns all in-app UI. A catch-all route serves the
shell so deep links work; `/api/v1/*` is the JSON API and `/cable` is the WebSocket endpoint.

```
app/
  controllers/app_controller.rb      # the shell
  controllers/api/v1/*               # JSON API
  channels/{list,user}_channel.rb    # real-time
  services/{gamification,achievements,presence,list_broadcaster,quest_creator,link_preview}.rb
  serializers/*                      # Alba, camelCase
  javascript/
    packs/questly.tsx                # entry
    app/{App,routes}.tsx  api/  cable/  components/  screens/  theme/  utils/
db/templates/*.yml                   # camping_trip, beach_trip, move_out
```

## Getting started

```bash
bin/setup                 # or: bundle install && npm install
bin/rails db:setup        # create + migrate + seed (9 achievements)
bin/dev                   # runs Puma + shakapacker-dev-server (Procfile.dev)
```

Open http://localhost:3000 — **Start a quest** or **Join with a code**.

- Node **20 LTS** recommended (dev works on 18, which is EOL).
- Requires a running PostgreSQL.

## Access model

No global accounts. You're identified by **email**; a quest is gated by a **shared password** + **quest
code**. `email + code + password` → Rails session cookie. New emails set a name + avatar. One host per
quest. Brute-force guard: 3 wrong passwords → 60s cooldown.

## Gamification

- **XP** on complete: `base 10 + priority bonus (0/10/25) + on-time bonus 10`.
- **Levels**: threshold(n) = `50·n·(n−1)`. **Streaks**: consecutive days (user tz).
- **9 badges** (First Blood, Speedrunner, 7-Day Streak, Team Player, Sharpshooter, Completionist,
  Night Owl, Grand Adventurer, Quest Master) — evaluated server-side, awarded idempotently, broadcast live.

## Testing

```bash
bin/rails test            # 54 tests: auth, board, detail, realtime, gamification, management
```

Browser flows were verified end-to-end with Playwright (including two-client live sync).
