import { HttpClientRequest } from "@effect/platform";
import { Chunk, Effect, Fiber, flow, Queue, Schedule, Stream } from "effect";
import { AppConfig } from "../config/app-config";
import { UserService } from "../user/user.service";
import { CronClient } from "./cron-client";

export class CronService extends Effect.Service<CronService>()(
	"effect-queue-streams/domain/cron/cron-service/CronService",
	{
		effect: Effect.gen(function* () {
			const appConfig = yield* AppConfig;
			const userService = yield* UserService;
			const client = yield* CronClient;

			const users = yield* userService.getUsersQueue();
			const usersStream = Stream.fromQueue(users.queue);
			yield* Effect.log(`Queue size: ${yield* Queue.size(users.queue)}`);

			const processUser = Effect.fn("cron-service.processUser")(function* (
				id: number,
			) {
				const request = HttpClientRequest.get(
					`${appConfig.BASE_URL}/process-user/${id}`,
				);
				yield* client.execute(request).pipe(Effect.forkDaemon);
				yield* Effect.log(`Processing user: ${id}`);
			});

			const processUsers = Effect.fn("cron-service.processUsers")(function* () {
				return yield* usersStream.pipe(
					Stream.groupedWithin(5, "2 seconds"),
					Stream.throttle({
						cost: () => 1,
						units: 1,
						duration: "2 seconds",
					}),
					Stream.takeUntil((c) => Chunk.contains(c, users.endToken)),
					Stream.map((c) => Chunk.filter(c, (id) => id !== users.endToken)),
					Stream.filter((c) => !Chunk.isEmpty(c)),
					Stream.mapEffect(
						flow(
							Stream.fromChunk,
							Stream.schedule(Schedule.spaced("200 millis")),
							Stream.tap(processUser),
							Stream.runDrain,
						),
						{ concurrency: "unbounded" },
					),
					Stream.runDrain,
				);
			});

			return { processUsers };
		}),
	},
) {}
