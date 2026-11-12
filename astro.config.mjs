import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: "Geist Sans",
			cssVariable: "--font-geist-sans",
			options: {
				variants: [{ src: ["./src/assets/fonts/GeistVF.woff"], weight: "100 900" }],
			},
		},
	],
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [
				// Forms: build forms in the admin, collect submissions, email notifications.
				formsPlugin({ defaultSpamProtection: "honeypot" }),
				// Sends all EmDash email (form notifications, magic links) through
				// Cloudflare Email Sending. The From address must be a verified sender
				// on a domain onboarded to Email Sending in your Cloudflare account.
				cloudflareEmail({
					from: { email: "forms@mail.rser.me", name: "rser.me" },
				}),
			],
		}),
	],
	devToolbar: { enabled: false },
});
