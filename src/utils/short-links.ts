import { getEmDashCollection } from "emdash";

type LinkBlock = { _type: "link"; url?: string; short_slug?: string };

/**
 * Find the destination for rser.me/<slug> by scanning Link blocks on every
 * published page. Matching is case-insensitive; the first match wins.
 */
export async function resolveShortLink(slug: string): Promise<string | null> {
	const wanted = slug.trim().toLowerCase();
	const { entries } = await getEmDashCollection("pages", { limit: 100 });
	for (const page of entries) {
		const blocks = (page.data.layout ?? []) as unknown as LinkBlock[];
		for (const block of blocks) {
			if (block._type === "link" && block.url && block.short_slug?.trim().toLowerCase().replace(/^\//, "") === wanted) {
				return block.url;
			}
		}
	}
	return null;
}
