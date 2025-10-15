import { HttpServerRequest } from "@effect/platform";
import { DateTime, Effect, Layer, ManagedRuntime, Schema } from "effect";
import { defineHandler } from "nitro/h3";
import { UserRepository } from "../domain/user/user.repository";
import { UserService } from "../domain/user/user.service";

const main = Effect.gen(function* () {
	const userService = yield* UserService;
	const { user } = yield* HttpServerRequest.schemaSearchParams(
		Schema.Struct({
			user: Schema.NumberFromString,
		}),
	);

	const start = yield* DateTime.now;
	yield* userService.processUser(user);
	const end = yield* DateTime.now;

	yield* Effect.log(
		`Processed user ${user} in ${end.epochMillis - start.epochMillis}`,
	);

	return {
		response: `User ${user} processed in ${end.epochMillis - start.epochMillis} ms`,
	};
});

const UserServiceLive = UserService.Default.pipe(
	Layer.provide(UserRepository.Default),
);

const ProcessUserRuntime = ManagedRuntime.make(UserServiceLive);

const provideSearchParams = (searchParams: Record<string, string | string[]>) =>
	Effect.provideService(HttpServerRequest.ParsedSearchParams, searchParams);

export default defineHandler((event) =>
	ProcessUserRuntime.runPromise(
		main.pipe(provideSearchParams(event.url.searchParams.toJSON())),
	),
);
