import { DateTime, Effect, Layer, ManagedRuntime } from "effect";
import { defineHandler } from "nitro/h3";
import { UserRepository } from "../../domain/user/user.repository";
import { UserService } from "../../domain/user/user.service";

const main = (user: number) =>
	Effect.gen(function* () {
		const userService = yield* UserService;

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

export default defineHandler((event) =>
	ProcessUserRuntime.runPromise(main(Number(event.context.params?.id))),
);
