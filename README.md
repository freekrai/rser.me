# rser.me

A self-hosted link-in-bio and short-link site, running at [rser.me](https://rser.me). Think Linktree, but it's yours: every link, heading and form is a block you edit in a CMS, and it runs on Cloudflare's free-tier-friendly stack.

Built with [EmDash](https://docs.emdashcms.com) (an Astro CMS), Tailwind CSS 4 and daisyUI 5, deployed to Cloudflare Workers with D1 and R2.

## Features

- **One block editor per page.** The home page is a Page with slug `home`, built from blocks you drag to reorder: profile header, social icons, section headings, links, rich text and contact forms. Other pages live at `/<slug>`.
- **Dialogs instead of page loads.** A link to one of your own pages (such as `/about`) and contact forms open as daisyUI dialogs over the link list.
- **Two kinds of short links:**
  - `/r/<code>` redirects to the URL in the `r` (short links) collection.
  - `/<slug>` redirects to any Link block with that **short link slug**. Tick **Hide on page** to keep it as a short link only.
- **Forms with email.** `@emdash-cms/plugin-forms` stores submissions and sends notifications through Cloudflare Email Sending.
- **Optional analytics.** [GetButters](https://getbutters.com) tracks pageviews, link and social clicks, dialog opens, form submits and short-link redirects. Lulu analytics and Datastar are loaded in the layout.

## Run it locally

You need [bun](https://bun.sh). This project uses bun only, not npm or pnpm.

```bash
bun install
cp .env.example .env              # then fill in EMDASH_ENCRYPTION_KEY (bunx emdash secrets generate)
bun run dev                       # http://localhost:4321, admin at /_emdash/admin
```

On first run EmDash applies `seed/seed.json` (the schema and starter blocks) to the empty local database. The setup wizard in the admin creates your account.

## Make it yours

If you fork this for your own domain, change these:

| File | What to change |
| --- | --- |
| `wrangler.jsonc` | Worker `name`, the `routes` custom domains, `EMDASH_SITE_URL`, and the D1/R2 names |
| `src/worker.ts` | The `www` to apex redirect host |
| `astro.config.mjs` | The `cloudflareEmail()` From address (must be a verified sender on a domain onboarded to Email Sending) |
| `src/layouts/Base.astro` | Remove or replace the Lulu analytics script |
| `src/pages/index.astro` | The footer text |
| `seed/seed.json` | Site title and starter content |
| `public/avatar.jpg` | Your photo (or set Settings → Logo in the admin) |

Everything else, including your links, bio and short links, is content you edit in the admin after deploying.

## Deploy to Cloudflare

```bash
bunx wrangler login
bun run deploy                    # astro build && wrangler deploy
```

The first deploy creates the D1 database and R2 bucket named in `wrangler.jsonc` and attaches your custom domains. Then:

1. Set the encryption key: `bunx emdash secrets generate`, then `bunx wrangler secret put EMDASH_ENCRYPTION_KEY`.
2. Open `https://<your-domain>/_emdash/admin` and finish setup.
3. For form emails, onboard a sending subdomain in Cloudflare Email Sending and use it in `astro.config.mjs`.
4. Optional: for GetButters, set `PUBLIC_BUTTERS_KEY`, `BUTTERS_API_KEY` and `BUTTERS_PROJECT_ID` as Worker secrets. Restrict the publishable key to your domain in GetButters. Without these, nothing is tracked.

The seed only applies to an empty database. After the first deploy, change the schema through the admin or the EmDash MCP server.

If the site returns 503 with "Database migrations are required", run `bunx emdash migrate --status --d1 <database>` and follow the [core migrations guide](https://docs.emdashcms.com/deployment/core-migrations/).

You can also connect the repo to Workers Builds so every push to `main` deploys.

## Project layout

```
src/
  components/blocks/   one component per block type
  components/          PageBlocks, DialogPill, ClickTracking, SocialIcon
  layouts/Base.astro   layout, backdrop, analytics and Datastar
  pages/               /, /[slug] (page or short link), /r/[code], 404
  utils/               short-link lookup, GetButters server tracking
  worker.ts            Worker entry and www redirect
seed/seed.json         schema, block types and starter content
```

`AGENTS.md` has the detailed notes for working on the code, written for both people and coding agents.

## License

[MIT](LICENSE)
