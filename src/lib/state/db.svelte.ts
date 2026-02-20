import { co, z, type SyncConfig } from 'jazz-tools';
import { PersistedState } from 'runed';

export const ProviderSchema = co.map({
	type: z.union([z.literal('openai')]),
	name: z.string().min(1).max(30),
	baseURL: z.url(),
	apiKey: z.string().nullable(),
	models: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
		}),
	),
});

export type Provider = co.output<typeof ProviderSchema>;

export const AccountRootSchema = co.map({
	providers: co.list(ProviderSchema),
});

export const AccountSchema = co
	.account({
		root: AccountRootSchema,
		profile: co.profile(),
	})
	.withMigration((account) => {
		if (!account.$jazz.has('root')) {
			account.$jazz.set('root', {
				providers: [],
			});
		}
	});

class DB {
	#syncEnabled = new PersistedState('wchat::sync-enabled', false);

	get syncEnabled() {
		return this.#syncEnabled.current;
	}

	set syncEnabled(value: boolean) {
		this.#syncEnabled.current = value;
	}

	#syncPeer = new PersistedState<`wss://${string}` | null>(
		'wchat::sync-peer',
		null,
	);

	get syncPeer() {
		return this.#syncPeer.current;
	}

	set syncPeer(value: `wss://${string}` | null) {
		this.#syncPeer.current = value;
	}

	public readonly syncConfig = $derived<SyncConfig>(
		this.syncEnabled && this.syncPeer
			? { peer: this.syncPeer, when: 'signedUp' }
			: { when: 'never' },
	);
}

export const db = new DB();
