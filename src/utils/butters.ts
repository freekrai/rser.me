/**
 * GetButters event tracking (https://getbutters.com).
 *
 * Events are sent from the Worker after the response, via waitUntil, so
 * tracking never slows a page or redirect. Configuration:
 *   BUTTERS_API_KEY     secret key (ev_...), server only
 *   BUTTERS_PROJECT_ID  project the server sends to
 *   PUBLIC_BUTTERS_KEY  publishable key (pk_...) for the browser SDK (see ClickTracking.astro)
 *   BUTTERS_URL         optional, defaults to https://app.getbutters.com
 * Nothing is sent without a key and project, or from localhost.
 */
import { env, waitUntil } from "cloudflare:workers";

export interface ButtersEvent {
	category: string;
	title: string;
	icon?: string;
	/** URL the event title opens in the Butters dashboard. */
	url?: string;
	description?: string;
	metadata?: Record<string, unknown>;
}

type ButtersEnv = {
	BUTTERS_API_KEY?: string;
	BUTTERS_PROJECT_ID?: string;
	PUBLIC_BUTTERS_KEY?: string;
	BUTTERS_URL?: string;
};
const config = env as unknown as ButtersEnv;

// Link-preview crawlers and bots (Slack, iMessage, social cards, uptime checks).
const BOT_UA =
	/bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|vkshare|pinterest|headless|lighthouse|uptime|monitor|curl\/|wget\/|python-requests|go-http-client/i;

/** Local development and previews on localhost never send events. */
export function isLocal(url: URL): boolean {
	return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".local");
}

/** The publishable key for the browser SDK, or null when tracking shouldn't run on this request. */
export function publicKeyFor(url: URL): string | null {
	return !isLocal(url) && config.PUBLIC_BUTTERS_KEY ? config.PUBLIC_BUTTERS_KEY : null;
}

export function isBot(request: Request): boolean {
	const ua = request.headers.get("user-agent") ?? "";
	return ua === "" || BOT_UA.test(ua);
}

/** Visitor context without personal data: country, referring site, device type. */
export function requestContext(request: Request): Record<string, string> {
	const ctx: Record<string, string> = {};
	const country = request.headers.get("cf-ipcountry");
	if (country && country !== "XX") ctx.country = country;
	const referrer = request.headers.get("referer");
	if (referrer) {
		try {
			ctx.referrer = new URL(referrer).hostname;
		} catch {
			/* ignore malformed referrers */
		}
	}
	const ua = request.headers.get("user-agent") ?? "";
	ctx.device = /mobile|iphone|android/i.test(ua) ? "mobile" : /ipad|tablet/i.test(ua) ? "tablet" : "desktop";
	return ctx;
}

/** Queue an event for Butters. Never throws and never delays the response. */
export function track(event: ButtersEvent): void {
	const apiKey = config.BUTTERS_API_KEY;
	const project = config.BUTTERS_PROJECT_ID;
	if (!apiKey || !project) return;

	const send = fetch(new URL("/api/events", config.BUTTERS_URL || "https://app.getbutters.com"), {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({ project, ...event }),
	})
		.then(async (res) => {
			if (!res.ok) console.warn(`[butters] ${res.status} ${(await res.text()).slice(0, 200)}`);
		})
		.catch((err) => console.warn("[butters] send failed:", err));

	waitUntil(send);
}

/** Track a short-link redirect (server side). */
export function trackRedirect(request: Request, path: string, destination: string, source: "r" | "block"): void {
	if (isBot(request) || isLocal(new URL(request.url))) return;
	track({
		category: "short-links",
		title: path,
		icon: "🔗",
		url: destination,
		metadata: { path, destination, source, ...requestContext(request) },
	});
}
