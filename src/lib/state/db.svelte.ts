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

export const ChatSchema = co.map({
	providerId: z.string().min(1).nullable(),
	modelId: z.string().min(1).nullable(),
});

export type ChatData = co.output<typeof ChatSchema>;

export const AccountRootSchema = co
	.map({
		providers: co.list(ProviderSchema),
		chats: co.list(ChatSchema),
	})
	.withMigration((root) => {
		if (!root.$jazz.has('chats')) {
			root.$jazz.set('chats', []);
		}
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
				chats: [],
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
