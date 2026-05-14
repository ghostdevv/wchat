import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { type AutomergeUrl, Repo } from '@automerge/automerge-repo';
import { Settings, type SettingsData } from './settings.svelte';
import { Providers, type Provider } from './providers.svelte';
import { Chats, type ChatData } from './chats.svelte';
import { ReactiveDoc } from './sync.svelte';
import { PersistedState } from 'runed';

export interface DatabaseDocument {
	providers: Provider[];
	settings: SettingsData;
	chats: Record<string, ChatData>;
}

export class Database extends ReactiveDoc<DatabaseDocument> {
	#settings: Settings | null = null;
	get settings() {
		this.#settings ??= new Settings(this);
		return this.#settings;
	}

	#providers: Providers | null = null;
	get providers() {
		this.#providers ??= new Providers(this);
		return this.#providers;
	}

	#chats: Chats | null = null;
	get chats() {
		this.#chats ??= new Chats(this);
		return this.#chats;
	}
}

class DatabaseManager {
	#url = new PersistedState<AutomergeUrl | null>('wchat::root', null);

	get url() {
		return this.#url.current;
	}

	set url(value: AutomergeUrl | null) {
		this.#url.current = value;
	}

	#repo = new Repo({
		network: [new BroadcastChannelNetworkAdapter()],
		storage: new IndexedDBStorageAdapter(),
	});

	#db: Database | null = null;

	async db() {
		if (this.#db && this.#db.handle.url === this.#url.current) {
			return this.#db;
		}

		if (this.#url.current) {
			// oxlint-disable-next-line unicorn/no-array-callback-reference
			const handle = await this.#repo.find<DatabaseDocument>(
				this.#url.current,
			);
			await handle.whenReady();
			this.#db = new Database(handle);
			return this.#db;
		}

		const handle = this.#repo.create<DatabaseDocument>({
			chats: {},
			providers: [],
			settings: {
				chat: { defaultModelId: null, defaultProviderId: null },
				nameGen: {
					enabled: false,
					modelId: null,
					prompt: '',
					providerId: null,
				},
			},
		});

		this.#url.current = handle.url;
		await handle.whenReady();
		this.#db = new Database(handle);
		return this.#db;
	}
}

export const dbm = new DatabaseManager();
