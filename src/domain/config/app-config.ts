import { Config, ConfigProvider, Effect, Layer, Option, Schema } from "effect";

export class AppConfig extends Effect.Service<AppConfig>()(
	"effect-queue-streams/domain/config/app-config/AppConfig",
	{
		effect: Effect.gen(function* () {
			const BASE_URL = yield* Config.string("VERCEL_URL").pipe(
				Config.map((url) => `https://${url}`),
				Config.withDefault("http://localhost:3000"),
			);

			const VERCEL_AUTOMATION_BYPASS_SECRET = yield* Config.redacted(
				"VERCEL_AUTOMATION_BYPASS_SECRET",
			).pipe(Config.option);

			return { BASE_URL, VERCEL_AUTOMATION_BYPASS_SECRET };
		}),
		dependencies: [Layer.setConfigProvider(ConfigProvider.fromEnv())],
	},
) {}
