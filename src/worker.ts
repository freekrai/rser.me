import handler, {
	createScheduledHandler,
	handleRoomUpgrade,
	PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
	...handler,
	fetch(request, env, ctx) {
		// Co-editing room connections must be handled before anything else.
		const upgrade = handleRoomUpgrade(request, env);
		if (upgrade) return upgrade;

		// Canonical host: www.rser.me -> rser.me (path and query preserved).
		const url = new URL(request.url);
		if (url.hostname === "www.rser.me") {
			url.hostname = "rser.me";
			return Response.redirect(url.toString(), 301);
		}

		return handler.fetch!(request, env, ctx);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler<Env>;
