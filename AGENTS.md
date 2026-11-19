This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
bun run dev             # Start the Astro dev server
bunx emdash types     # Regenerate TypeScript types from a running site
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)                 |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- When Astro's cache is enabled, pass content-query hints to `Astro.cache.set(cacheHint)`. Use the `WithCacheHint` variants for site settings, menus, taxonomies, and widget areas rendered by cached routes.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Site

rser.me is an open-source (MIT) link-in-bio and short-link site. It uses Tailwind CSS 4, daisyUI 5 and the Geist font: a blue-50 page, a wave and cloud backdrop, and white pill links. It deploys to Cloudflare Workers (D1 `rser`, R2 `rser-media`) at rser.me, and `www` 301s to the apex in `src/worker.ts`. `README.md` covers setup and the files a fork changes.

**Use bun only** (never npm or pnpm). `bunfig.toml` enforces a 24-hour `minimumReleaseAge`, with EmDash packages exempt. If `bun install` refuses a version, keep the previous range rather than removing the safeguard.

The repo is public. Never commit `.env`, secrets or account IDs. `.env.example` lists the variables.

## Pages

| Path      | What it shows |
| --------- | ------------- |
| `/`       | The Page with slug `home`, rendered from its blocks |
| `/[slug]` | 1) a Page with that slug; 2) else a Link block whose `short_slug` matches → 302 redirect; 3) else 404 |
| `/r/[code]` | 302 to the `url` of the published `r` (short links) entry whose slug is `code`, else 404. Also tries the slug with a leading `/`, since the admin accepts one |

## Schema

- `pages` with `title` and `layout` (a `blocks` field, max 100 blocks).
- `r` (short links): entry slug is the code, `url` (required, unique) is the destination. Served by `src/pages/r/[code].astro`.
- Block types (`seed/seed.json` → `blockTypes`, rendered by `src/components/blocks/*` via `src/components/PageBlocks.astro`):
  - `profile` (name, bio, avatar; avatar falls back to Settings → Logo, then `/public/avatar.jpg`)
  - `socials` (repeater: platform, url, label; icons from `simple-icons`)
  - `heading` (section title)
  - `link` (title, url, description, thumbnail, badge, `short_slug`, `hidden`). A link to one of our own pages (`/about`) opens that page in a dialog (`src/components/DialogPill.astro`); `hidden` makes it a short link only.
  - `text` (Portable Text)
  - `form` (embeds a Forms plugin form by slug as a pill + dialog; hidden until the form exists)
- Short-link lookup: `src/utils/short-links.ts`.

## Plugins and services

- `@emdash-cms/plugin-forms` for forms/submissions; notifications via `cloudflareEmail()` (binding `EMAIL`, sender `forms@mail.rser.me`, Email Sending subdomain `mail.rser.me`).
- Layout loads Lulu analytics and Datastar v1.0.5 (CDN). SSE helpers for Datastar partials live in `src/lib/datastar.ts`.

## Analytics (GetButters)

Events go to the GetButters project in `BUTTERS_PROJECT_ID`. Nothing is sent from localhost.
- Browser (`src/components/ClickTracking.astro`, `@getbutters/js` with the publishable key `PUBLIC_BUTTERS_KEY`): pageviews, plus `clicks` (link pills), `socials`, `dialogs` (About/Contact opens) and `forms` (form submits). Labels come from `data-track-label`.
- Server (`src/utils/butters.ts`, secret key `BUTTERS_API_KEY`, sent after the response via `waitUntil`): `short-links` for `/r/<code>` and Link-block short-link redirects, skipping bots and link-preview crawlers.
- Keys live in `.env` locally and as Worker secrets in production. All three are optional: without them nothing is tracked. Never commit them or expose `BUTTERS_API_KEY` to the browser. The publishable key is origin-restricted in GetButters.

## Deploy

`bun run deploy` (astro build && wrangler deploy). Production also deploys through Workers Builds on every push to `main`, and only the owner can push to `main`. Secrets via `bunx wrangler secret put`. If the site 503s with "Database migrations are required", inspect with `bunx emdash migrate --status --d1 rser` and follow https://docs.emdashcms.com/deployment/core-migrations/. Schema changes on the live site go through the admin/MCP (the seed only applies to an empty database).
