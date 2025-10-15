import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer, ManagedRuntime } from "effect";
import { defineHandler } from "nitro/h3";
import { AppConfig } from "../domain/config/app-config";
import { CronClient } from "../domain/cron/cron-client";
import { CronService } from "../domain/cron/cron-service";
import { UserRepository } from "../domain/user/user.repository";
import { UserService } from "../domain/user/user.service";

const CronServiceLive = CronService.Default.pipe(
	Layer.provide(CronClient.Default),
	Layer.provide(UserService.Default),
	Layer.provide(UserRepository.Default),
	Layer.provide(FetchHttpClient.layer),
	Layer.provide(AppConfig.Default),
);

const CronRuntime = ManagedRuntime.make(CronServiceLive);

const main = Effect.gen(function* () {
	const cronService = yield* CronService;
	yield* cronService.processUsers();
	return { started: true };
});

export default defineHandler(() => CronRuntime.runPromise(main));
