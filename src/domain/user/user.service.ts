import { Array, Effect, Queue, Random } from "effect";
import { UserRepository } from "./user.repository";

export class UserService extends Effect.Service<UserService>()(
	"effect-queue-streams/domain/user/user/UserService",
	{
		effect: Effect.gen(function* () {
			const userRepo = yield* UserRepository;

			const getUsersQueue = Effect.fn("user-service.getUsersQueue")(
				function* () {
					const userQueue = yield* Queue.unbounded<number>();
					const users = yield* userRepo.getAll();
					yield* Queue.offerAll(userQueue, users);
					return userQueue;
				},
			);

			const processUser = Effect.fn("user-service.processUser")(function* (
				id: number,
			) {
				const user = yield* userRepo.getUserById(id);
				// Fake expensive calc
				const wait = yield* Random.nextIntBetween(1000, 5000);
				yield* Effect.sleep(`${wait} millis`);
				return { user };
			});

			return { getUsersQueue, processUser };
		}),
	},
) {}
