import {
	HttpApp,
	HttpRouter,
	HttpServer,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { DateTime, Effect, Layer, Schema } from "effect";
import { UserRepository } from "../domain/user/user.repository";
import { UserService } from "../domain/user/user.service";

const UserServiceLive = UserService.Default.pipe(
	Layer.provide(UserRepository.Default),
);

const router = HttpRouter.empty.pipe(
	HttpRouter.get(
		"*",
		Effect.gen(function* () {
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

			return yield* HttpServerResponse.text(
				`Processed user ${user} in ${end.epochMillis - start.epochMillis}`,
			);
		}),
	),
	Effect.provide(UserServiceLive),
);

const app = router.pipe(
	HttpServer.serve(),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
	Layer.launch,
);
const handler = HttpApp.toWebHandler(app);
export default handler;
