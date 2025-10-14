import { HttpClient } from "@effect/platform";
import { Effect } from "effect";

export class CronClient extends Effect.Service<CronClient>()(
	"effect-queue-streams/domain/cron/cron-client/CronClient",
	{
		effect: Effect.gen(function* () {
			const client = yield* HttpClient.HttpClient;
			return client.pipe(HttpClient.filterStatusOk);
		}),
	},
) {}
