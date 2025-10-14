import { HttpClientRequest } from "@effect/platform";
import { Effect, flow, Schedule, Stream } from "effect";
import { UserService } from "../user/user.service";
import { CronClient } from "./cron-client";

export class CronService extends Effect.Service<CronService>()(
	"effect-queue-streams/domain/cron/cron-service/CronService",
	{
		effect: Effect.gen(function* () {
			const userService = yield* UserService;
			const client = yield* CronClient;

			const users = yield* userService.getUsersQueue();
			const usersStream = Stream.fromQueue(users);

			const processUser = Effect.fn("cron-service.processUser")(function* (
				id: number,
			) {
				const request = HttpClientRequest.get("/api/process-user").pipe(
					HttpClientRequest.setUrlParam("user", `${id}`),
				);
				yield* Effect.fork(client.execute(request));
				yield* Effect.log(`Processing user: ${id}`);
			});

			const processUsers = Effect.fn("cron-service.processUsers")(function* () {
				return yield* usersStream.pipe(
					Stream.grouped(10),
					Stream.throttle({ cost: () => 1, units: 1, duration: "5  seconds" }),
					Stream.tap((users) => Effect.log(`Processing user chunk: ${users}`)),
					Stream.mapEffect(
						flow(
							Stream.fromChunk,
							Stream.schedule(Schedule.spaced("200 millis")),
							Stream.tap(processUser),
							Stream.runDrain,
						),
					),
					Stream.runDrain,
				);
			});

			return { processUsers };
		}),
	},
) {}
