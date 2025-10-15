import { Config, ConfigProvider, Effect, Layer } from "effect";

export class AppConfig extends Effect.Service<AppConfig>()(
	"effect-queue-streams/domain/config/app-config/AppConfig",
	{
		effect: Effect.gen(function* () {
			const BASE_URL = yield* Config.string("VERCEL_URL").pipe(
				Config.map((url) => `https://${url}`),
				Config.withDefault("http://localhost:3000"),
			);
			return { BASE_URL };
		}),
		dependencies: [Layer.setConfigProvider(ConfigProvider.fromEnv())],
	},
) {}
