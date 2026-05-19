import { PUBLIC_JAZZ_APP_ID } from '$env/static/public';
import { createSubscriber } from 'svelte/reactivity';
import { PersistedState } from 'runed';
import {
	BrowserAuthSecretStore,
	type QueryBuilder,
	createDb,
	type Db,
} from 'jazz-tools';

export interface LiveQuery<T extends { id: string }> {
	readonly current: T[];
}

export async function query<T extends { id: string }>(
	db: Db,
	query: QueryBuilder<T>,
): Promise<LiveQuery<T>> {
	let current = await db.all(query);

	const subscribe = createSubscriber((update) => {
		return db.subscribeAll(query, (delta) => {
			current = delta.all;
			update();
		});
	});

	return {
		get current() {
			subscribe();
			return current;
		},
	};
}

async function setupDb(sync: boolean) {
	return await createDb({
		appId: PUBLIC_JAZZ_APP_ID,
		// oxlint-disable-next-line no-undefined
		serverUrl: sync ? import.meta.env.PUBLIC_JAZZ_SERVER_URL : undefined,
		secret: await BrowserAuthSecretStore.getOrCreateSecret({
			appId: PUBLIC_JAZZ_APP_ID,
		}),
	});
}

class Sync {
	#enabled = new PersistedState('wchat::sync-enabled', false);

	get enabled() {
		return this.#enabled.current;
	}

	set enabled(value: boolean) {
		if (this.#enabled.current !== value) {
			this.#db = null;
		}

		this.#enabled.current = value;
	}

	#db: Promise<Db> | null = null;

	db() {
		console.log('db()', this.enabled, !!this.#db);
		this.#db ??= setupDb(this.enabled);
		return this.#db;
	}
}

export const sync = new Sync();
