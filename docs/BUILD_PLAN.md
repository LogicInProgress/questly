# Questly — Build Plan

Phased implementation plan derived from the product spec, backend docs, and wireframe pack.
Maps the spec's 7-step build order to concrete files and tasks.

---

## 0. Scaffold reconciliation (decisions before code)

The working directory is a **stock Rails 8.1** app. Three defaults conflict with the spec:

### Decision A — Frontend build tooling  → **DONE: Shakapacker + webpack + swc + React/TS**
Scaffold ships importmap + Stimulus + propshaft. The spec mandated Shakapacker + **rspack**,
but Shakapacker 8.4 (current stable) does **not** support rspack — it supports webpack with
babel/**swc**/esbuild transpilers. We use **swc** (near-rspack build speed) as the faithful
substitute; swc mode also sidesteps `webpack-assets-manifest`'s Node ≥20 requirement (we're on
Node 18). What was done:
- Removed `importmap-rails`, `turbo-rails`, `stimulus-rails`, `tailwindcss-rails`, `jbuilder`;
  deleted `app/javascript/controllers/*`, `config/importmap.rb`, `app/assets/tailwind`.
- Added `shakapacker` gem; ran installer; set `webpack_loader: 'swc'` in `config/shakapacker.yml`.
- `config/swc.config.js` enables React 18 automatic JSX runtime.
- `package.json`: React 18, TS, swc, TanStack Query, react-router-dom, @rails/actioncable,
  react-hook-form, zod, framer-motion, canvas-confetti, tailwind + postcss loaders.
- `@/` → `app/javascript/app` alias wired in both `tsconfig.json` and `config/webpack/webpack.config.js`.
- Kept `propshaft` for Rails-side static assets (coexists with Shakapacker's `public/packs`).
- **Note:** Node 18.20.8 is EOL — compiles fine today; upgrade to Node 20 LTS when convenient.

### Decision B — Jobs & ActionCable adapter  → **DECIDED: keep the Solid stack**
Scaffold ships Solid Queue / Solid Cable / Solid Cache (all Postgres-backed, **no Redis**).
The spec assumed Sidekiq + Redis, but we keep the Rails 8 Solid stack:
- Solid Queue runs the loot-link fetch job; Solid Cable carries broadcasts. No Redis infra.
- Presence can't use a Redis set — track the online set per list in a small in-process or
  Postgres-backed presence store (see Phase 5).

### Decision C — Styling  → **Tailwind through the rspack/PostCSS pipeline**
Scaffold has `tailwindcss-rails` (standalone CLI, for propshaft). For the React SPA it's cleaner
to run Tailwind via PostCSS inside rspack so it applies to `.tsx`. Drop `tailwindcss-rails`.
Port the wireframe `:root` CSS variables verbatim into the Tailwind theme / a `tokens.css`.

### Gems to add
`bcrypt` (uncomment), `alba` (camelCase serializers), `rack-attack` (join throttle),
`shakapacker`. Keep `pg`, `puma`, `propshaft`, `solid_*`.

---

## Phase 1 — Foundations & the React-in-Rails shell

**Goal:** one Rails route serves a React shell that boots and routes client-side.

- `AppController#index` → `app/views/app/index.html.erb` with `<div id="questly-root">`,
  `<%= javascript_pack_tag "questly" %>`, `<%= csrf_meta_tags %>`.
- `config/routes.rb`:
  ```ruby
  namespace :api do; namespace :v1 do; end; end
  mount ActionCable.server => "/cable"
  get "*path", to: "app#index",
      constraints: ->(r){ !r.path.start_with?("/api", "/cable", "/rails") }
  root "app#index"
  ```
- Shakapacker: `config/shakapacker.yml`, `rspack.config.js`, `tsconfig.json`, `postcss.config.js`.
- `app/javascript/packs/questly.tsx` mounts `<App/>` into `#questly-root`.
- Frontend skeleton:
  `app/javascript/app/{App.tsx, routes.tsx, api/client.ts, cable/consumer.ts, components/, screens/, theme/tokens.css}`.
- Client-side routes: `/`, `/join`, `/onboarding`, `/quests`, `/q/:code`,
  `/q/:code/objective/:id`, `/q/:code/party`, `/q/:code/ranks`, `/q/:code/feed`, `/me`, `/badges`.
- Fetch client: `credentials: "same-origin"` + `X-CSRF-Token` from meta tag on writes.
- TanStack Query provider; theme tokens ported from wireframe `:root`; Fredoka + Inter fonts.
- `Procfile.dev`: `bin/rails s` + `bin/shakapacker-dev-server`.

**Exit check:** `/` renders the shell, React mounts, a placeholder route renders.

---

## Phase 2 — Data model & migrations

**Goal:** all tables, models, seeds per backend doc §1.

- Enable `citext` extension (for `users.email`).
- Migrations (11 tables): `users, lists, memberships, objectives, loot_links, tags,
  objective_tags, comments, achievements, user_achievements, activities`.
- Key details: `lists.password_digest` (`has_secure_password`), enums
  (`memberships.role`, `objectives.priority/status`, `loot_links.kind`),
  `activities.meta` jsonb, unique indexes `(list_id,user_id)`, `(list_id,name)`,
  `(objective_id,tag_id)`, `(user_id,achievement_id)`, `lists.join_code`.
- Perf indexes: `objectives(list_id,status)`, `objectives(list_id,position)`,
  `activities(list_id,created_at desc)`.
- Models with associations, enums, validations (title 1–140, password min 4,
  join_code 6–8 chars no ambiguous `0/O/1/I`).
- Seeds: 9 achievements catalog; 3 templates (`camping_trip, beach_trip, move_out`) as YAML
  in `db/templates/` (not a table).

**Exit check:** `rails db:migrate db:seed` clean; schema matches doc.

---

## Phase 3 — Auth + join flow  *(spec build step 1 · S01–S04, S19)*

**Goal:** email + code + password → session cookie → member.

- `POST /auth/join`: find list by `join_code` → `authenticate(password)` →
  find_or_create user by email → find_or_create membership → `session[:user_id]`.
  New user missing name/avatar → `422 needs_profile`. Return `{user, list{membership}, is_new_user}`.
  Statuses: 401 wrong pw · 404 code not found · 422 needs_profile · 429 cooldown.
- `DELETE /auth/session` (sign out), `POST /auth/verify` (optional), `GET /me`.
- `rack-attack`: throttle `POST /auth/join` by `email+join_code`, 3 fails → 60s block.
- Controller concerns: `current_user`, `require_member!`, `require_host!`.
- Capture client timezone on join (for streaks / relative dates).
- **React:** S01 splash, S02 join, S03 create profile (avatar grid + name, welcome XP),
  S04 create quest (emblem, name, password, starter tags, template picker),
  S19 access error (coral field + cooldown copy). react-hook-form + zod.

**Exit check:** wrong/right password, new vs returning user, cooldown all behave; refresh keeps session.

---

## Phase 4 — Quest board read + create objective  *(step 2 · S05, S06, S08, S18)*

- REST: `GET /lists` (progress + member avatars), `POST /lists` (name, emblem, password,
  tag_names[], template_key?), `GET /lists/:code`, `GET/POST /lists/:code/objectives`
  (filters `?tag=&status=&due=soon`), `PATCH/DELETE /objectives/:id`.
- Eager-load `objectives → {loot_links, tags, assignee}` (avoid N+1).
- `alba` serializers → camelCase.
- **React:** S05 dashboard (XP header, quest cards, FAB), S06 board (tag-grouped sections,
  filter row, quest XP bar, objective rows), S08 add-objective bottom sheet, S18 empty state.
  TanStack Query hooks; reusable `BottomSheet`, `ObjectiveRow`, `QuestCard`, `XpBar`.

**Exit check:** create quest (with template) → board renders grouped objectives; add objective persists.

---

## Phase 5 — Loot links, tags, objective detail  *(step 3 · S07, S09, S10)*

- REST: `POST /objectives/:id/loot_links`, `PATCH/DELETE /loot_links/:id`,
  `POST /loot_links/preview`; tags CRUD; comments GET/POST/DELETE.
- **Loot-link fetch job** (Solid Queue): GET url, parse `og:title`/`<title>`, `og:image`,
  best-effort price (`og:price:amount`/JSON-LD). Timeout 5s, ≤3 redirects, cap body, sanitize;
  fallback to host as title.
- **React:** S07 tag grid (counts, tap-to-filter), S09 objective detail (loot links, assignee,
  party chat, mark complete), S10 add-loot-link sheet with live preview.

**Exit check:** paste URL → preview populates; link/tag/comment persist and show on detail.

---

## Phase 6 — Real-time layer  *(step 4 · S15)*

- `ListChannel`: verify membership in `subscribed`, `stream_from "list:#{list.id}"`.
  `UserChannel`: `stream_from "user:#{id}"` (mentions, assignments, reminders).
- Broadcast envelope `{type, payload, actor:{id,name,avatar}}` for all event types:
  `objective.created/updated/completed/reopened/deleted`, `loot_link.created`, `tag.created`,
  `comment.created`, `member.joined`, `member.xp_changed`, `achievement.earned`, `presence`.
- **Presence (no Redis):** track online set per list via ActionCable `appear/away` callbacks
  writing to a Postgres-backed or in-process store; broadcast `presence` on change.
  (If Decision B → Sidekiq/Redis, use a Redis set `list:<id>:online` instead.)
- **React:** actioncable consumer, `useListChannel` hook that patches the TanStack Query cache
  per event (no refetch), reconnecting/offline banner, presence indicator, S15 activity feed.

**Exit check:** two browsers — add/complete/comment in one appears in the other <1s; presence updates.

---

## Phase 7 — Gamification  *(step 5 · S11, S13, S14)*

- `Gamification` service (server-authoritative): XP `base 10 + priority_bonus + on_time_bonus`;
  award to `users.xp_total` + `memberships.xp_in_list`. Levels `50*n*(n-1)` + title bands.
  Streaks (user tz: today=noop, yesterday=+1, else reset 1). Achievements evaluated after each
  complete (+ join for team_player), awarded idempotently, broadcast `achievement.earned`.
- Wire `POST /objectives/:id/complete` + `/reopen` (reopen does not claw back XP in v1).
- `PATCH /lists/:code/objectives/reorder`.
- Nightly job to zero missed streaks.
- **React:** S11 celebration overlay (canvas-confetti, XP gain, level progress; respect
  `prefers-reduced-motion`), S13 leaderboard (podium + list), S14 badges (earned/locked grid +
  progress), achievements API `GET /me/achievements`.

**Exit check:** complete → correct XP/level/streak/badge; celebration fires; leaderboard reorders live.

---

## Phase 8 — Party, settings, profile, states  *(step 6 · S12, S16, S17)*

- REST: `GET /lists/:code/members`, `/leaderboard`, `PATCH /lists/:code` (host: name/emblem/
  password/color), `DELETE /lists/:code`, `PATCH /me`, leave quest.
- `require_host!` on settings/delete.
- **React:** S12 party (members, presence, roles, share code/link), S16 profile (player card,
  stats, edit avatar/name), S17 quest settings (host controls), and the global states for every
  data screen: loading skeletons, empty, error, offline/reconnecting banner.

---

## Phase 9 — Templates + polish  *(step 7)*

- Apply template at quest creation (insert tags + objectives from YAML).
- Copy/style pass: sentence case, outcome-named buttons, one accent per surface
  (violet=primary, gold=rewards, coral=urgency, green=done), functional emoji.
- Reduced-motion audit, animation polish (Framer Motion card/XP transitions), N+1 sweep.

---

## Testing (write alongside, prioritize these)

1. **Join flow:** right/wrong password, new vs returning user, cooldown (429).
2. **Complete:** XP + level + streak + badge awarding; reopen does not claw back.
3. **Socket:** broadcast fires on complete; membership gate in `ListChannel#subscribed`.

---

## Suggested execution order

Phase 0 (decisions) → 1 (shell) → 2 (data) → 3 (auth) → 4 (board) → 5 (loot/tags) →
6 (real-time) → 7 (gamification) → 8 (party/settings/states) → 9 (templates/polish).

Phases 1–2 are prerequisites for everything; 3 unblocks all authenticated work; 6 can begin
once 4 exists (broadcasts hook into existing endpoints).
