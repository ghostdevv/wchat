import type { Db } from 'jazz-tools';
import { query } from './db.svelte';
import {
	type NameGenSettings,
	type ChatSettings,
	type KV,
	app,
} from '$lib/schema';

function createProxy<T extends KV['value']>(
	db: Db,
	key: KV['key'],
	object: T,
	id?: string,
) {
	return new Proxy(object, {
		set(target, tkey, value) {
			if (!Reflect.has(target, tkey)) {
				return false;
			}

			if (id) {
				db.update(app.kv, id, {
					value: { ...object, [tkey]: value },
				});
			} else {
				db.insert(app.kv, {
					key,
					value: { ...object, [tkey]: value },
				});
			}

			return true;
		},
	});
}

export async function getNameGenSettings(db: Db): Promise<NameGenSettings> {
	const raw = await db.one(app.kv.where({ key: 'settings::name-gen' }));
	return raw
		? (raw.value as NameGenSettings)
		: { enabled: false, prompt: '', modelId: null, providerId: null };
}

export async function getChatSettings(db: Db): Promise<ChatSettings> {
	const raw = await db.one(app.kv.where({ key: 'settings::chat' }));
	return raw
		? (raw.value as ChatSettings)
		: { defaultModelId: null, defaultProviderId: null };
}

export async function useSettings(db: Db) {
	const name = await query(db, app.kv.where({ key: 'settings::name-gen' }));
	const chat = await query(db, app.kv.where({ key: 'settings::chat' }));

	return {
		get nameGen() {
			return createProxy<NameGenSettings>(
				db,
				'settings::name-gen',
				(name.current.at(0)?.value as NameGenSettings) ?? {
					enabled: false,
					prompt: '',
					modelId: null,
					providerId: null,
				},
				name.current.at(0)?.id,
			);
		},
		get chat() {
			return createProxy<ChatSettings>(
				db,
				'settings::chat',
				(chat.current.at(0)?.value as ChatSettings) ?? {
					defaultModelId: null,
					defaultProviderId: null,
				},
				chat.current.at(0)?.id,
			);
		},
	};
}
