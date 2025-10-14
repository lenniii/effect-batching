import {
	FetchHttpClient,
	HttpApp,
	HttpRouter,
	HttpServer,
	HttpServerResponse,
} from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { CronClient } from "../domain/cron/cron-client";
import { CronService } from "../domain/cron/cron-service";
import { UserRepository } from "../domain/user/user.repository";
import { UserService } from "../domain/user/user.service";

const CronServiceLive = CronService.Default.pipe(
	Layer.provide(CronClient.Default),
	Layer.provide(UserService.Default),
	Layer.provide(UserRepository.Default),
	Layer.provide(FetchHttpClient.layer),
);

const router = HttpRouter.empty.pipe(
	HttpRouter.get(
		"*",
		Effect.gen(function* () {
			const cronService = yield* CronService;
			yield* cronService.processUsers();
			return yield* HttpServerResponse.text("Started processing users");
		}),
	),
	Effect.provide(CronServiceLive),
);

const app = router.pipe(
	HttpServer.serve(),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
	Layer.launch,
);
const handler = HttpApp.toWebHandler(app);
export default handler;
