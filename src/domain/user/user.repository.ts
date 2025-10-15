import { Array, Effect, Random } from "effect";

export class UserRepository extends Effect.Service<UserRepository>()(
	"effect-queue-streams/domain/user/user.repository/UserRepository",
	{
		sync: () => ({
			getAll: Effect.fn("user-repository.getAll")(() =>
				Random.nextIntBetween(100, 1000).pipe(
					Effect.andThen((ms) => Effect.sleep(`${ms} millis`)),
					Effect.map(() => Array.range(0, 49)),
				),
			),

			getUserById: Effect.fn("user-repository.getUserById")((id: number) =>
				Random.nextIntBetween(100, 1000).pipe(
					Effect.andThen((ms) => Effect.sleep(`${ms} millis`)),
					Effect.map(() => id),
				),
			),
		}),
	},
) {}
