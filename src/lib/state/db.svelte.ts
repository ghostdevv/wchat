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
	messages: z.array(z.json()),
	locked: z.boolean(),
	name: z.string().optional(),
});

export type ChatData = co.output<typeof ChatSchema>;

export const NameGenSettingsSchema = co.map({
	enabled: z.boolean(),
	providerId: z.string().min(1).nullable(),
	modelId: z.string().min(1).nullable(),
	prompt: z.string().min(1),
});

export const AccountRootSchema = co
	.map({
		providers: co.list(ProviderSchema),
		chats: co.list(ChatSchema),
		nameGenSettings: NameGenSettingsSchema,
	})
	.withMigration((root) => {
		if (!root.$jazz.has('chats')) {
			root.$jazz.set('chats', []);
		}

		if (!root.$jazz.has('nameGenSettings')) {
			root.$jazz.set('nameGenSettings', {
				enabled: false,
				providerId: null,
				modelId: null,
				prompt: '',
			});
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
				nameGenSettings: {
					enabled: false,
					providerId: null,
					modelId: null,
					prompt: '',
				},
			});
		}
	});

class Sync {
	#enabled = new PersistedState('wchat::sync-enabled', false);

	get enabled() {
		return this.#enabled.current;
	}

	set enabled(value: boolean) {
		this.#enabled.current = value;
	}

	#peer = new PersistedState<`wss://${string}` | null>(
		'wchat::sync-peer',
		null,
	);

	get peer() {
		return this.#peer.current;
	}

	set peer(value: `wss://${string}` | null) {
		this.#peer.current = value;
	}

	public readonly config = $derived<SyncConfig>(
		this.enabled && this.peer
			? { peer: this.peer, when: 'signedUp' }
			: { when: 'never' },
	);
}

export const sync = new Sync();
