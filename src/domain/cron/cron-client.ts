import { HttpClient, type HttpClientRequest } from "@effect/platform";
import { Effect, Option, Redacted } from "effect";
import { AppConfig } from "../config/app-config";

const withHeaders =
	(headers: Record<string, string>) =>
	(self: HttpClient.HttpClient): HttpClient.HttpClient =>
		self.pipe(
			HttpClient.mapRequest((req) => ({
				...req,
				headers: { ...req.headers, ...headers },
			})),
		);

export class CronClient extends Effect.Service<CronClient>()(
	"effect-queue-streams/domain/cron/cron-client/CronClient",
	{
		effect: Effect.gen(function* () {
			const appConfig = yield* AppConfig;
			const client = yield* HttpClient.HttpClient;

			const defaultHeaders = yield* Option.match(
				appConfig.VERCEL_AUTOMATION_BYPASS_SECRET,
				{
					onNone: () =>
						Effect.logWarning(
							"Vercel Automation Bypass Secret not set, requests may fail",
						).pipe(() => Effect.succeed({})),
					onSome: (secret) =>
						Effect.succeed({
							"x-vercel-protection-bypass": Redacted.value(secret),
						}),
				},
			);

			return client.pipe(
				HttpClient.filterStatusOk,
				withHeaders(defaultHeaders),
			);
		}),
	},
) {}
