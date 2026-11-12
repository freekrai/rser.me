# rser.me

Link-in-bio + short links for Roger Stringer, built on [EmDash](https://docs.emdashcms.com) (Astro) with Tailwind CSS 4 + daisyUI 5, deployed to Cloudflare Workers (D1 + R2). Bun only.

## Develop

```bash
bun install
bun run dev        # http://localhost:4321  ·  admin: /_emdash/admin
```

## How content works

Everything is a **Page** built from blocks in one editor. The page with slug `home` is the home page; any other page lives at `/<slug>` (e.g. `/about`).

Block types (defined in `seed/seed.json` → `blockTypes`, rendered by `src/components/blocks/*`):

| Block | What it does |
| --- | --- |
| Profile header | Avatar, name, bio (avatar falls back to Settings → Logo, then `/public/avatar.jpg`) |
| Social icons | Row of icons; platform picks the icon |
| Section heading | Starts a group, e.g. "My Projects / Sites" |
| Link | Card with title, URL, description, thumbnail, badge. **Short link slug** makes `rser.me/<slug>` 302-redirect to it; **Hide on page** keeps it as a short link only |
| Text | Rich text paragraph(s) |
| Contact form | Embeds a form from Plugins → Forms by slug; invisible until that form exists |

Drag blocks to reorder. `rser.me/<slug>` resolves: Page first, then Link-block short slug, else 404.

## Forms + email

`@emdash-cms/plugin-forms` stores submissions (Plugins → Forms / Submissions). Notifications go out through Cloudflare Email Sending (`cloudflareEmail()` in `astro.config.mjs`, `send_email` binding `EMAIL` in `wrangler.jsonc`). The From address `forms@mail.rser.me` is on `mail.rser.me`, the Email Sending subdomain (iCloud Mail on the apex is untouched).

## Deploy (Cloudflare)

```bash
bunx wrangler login
bun run deploy     # astro build && wrangler deploy — creates D1 "rser" + R2 "rser-media" on first deploy
```

Production is live at https://rser.me (custom domains `rser.me` + `www.rser.me`, www 301s to apex). If a deploy ever 503s with "Database migrations are required", run `bunx emdash migrate --status --d1 rser` and follow https://docs.emdashcms.com/deployment/core-migrations/.
