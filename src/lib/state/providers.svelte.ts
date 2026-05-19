import { query, sync } from './db.svelte';
import type { Db } from 'jazz-tools';
import { app } from '$lib/schema';

export interface Provider {
	id: string;
	type: 'openai';
	name: string;
	baseURL: string;
	apiKey: string | null;
	models: Model[];
}

export interface Model {
	id: string;
	name: string;
}

async function fetchModels(
	baseURL: string,
	apiKey?: string | null,
): Promise<{ id: string; name: string }[]> {
	const url = new URL(baseURL);
	url.pathname += '/models';

	const headers = new Headers();
	if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);

	const result = await fetch(url, { headers });
	const json: { data: { id: string; name?: string }[] } = await result.json();

	return json.data.map((m) => ({ id: m.id, name: m.name ?? m.id }));
}

export async function useProviders(db: Db) {
	const providers = await query(db, app.providers);

	return {
		get current() {
			return providers.current;
		},
		async create(name: string, baseURL: string, apiKey: string | null) {
			const models = await fetchModels(baseURL, apiKey).catch(() => []);

			db.insert(app.providers, {
				type: 'openai',
				name,
				baseURL,
				apiKey,
				models,
			});
		},
		async edit(
			id: string,
			name: string,
			baseURL: string,
			apiKey: string | null,
		) {
			const models = await fetchModels(baseURL, apiKey).catch(() => []);

			db.update(app.providers, id, {
				name,
				baseURL,
				apiKey,
				models,
			});
		},
		delete(id: string) {
			db.delete(app.providers, id);
		},
	};
}

export async function getModel(
	providerId: string | null,
	modelId: string | null,
) {
	if (!providerId || !modelId) {
		throw new Error('Provider or model ID not set');
	}

	const db = await sync.db();

	const provider = await db.one(app.providers.where({ id: providerId }));
	if (!provider) throw new Error('Provider not found');

	const { createOpenAI } = await import('@ai-sdk/openai');
	const ai = createOpenAI({
		baseURL: provider.baseURL,
		apiKey: provider.apiKey ?? void 0,
	});

	return ai.chat(modelId);
}
