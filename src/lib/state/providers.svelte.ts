import type { Database } from './db.svelte';

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

export class Providers {
	constructor(private readonly db: Database) {}

	get current(): Readonly<Provider[]> {
		return this.db.current.providers;
	}

	async create(name: string, baseURL: string, apiKey: string | null) {
		const models = await fetchModels(baseURL, apiKey).catch(() => []);

		this.db.change((d) => {
			d.providers.push({
				id: crypto.randomUUID(),
				type: 'openai',
				name,
				baseURL,
				apiKey,
				models,
			});
		});
	}

	delete(id: string) {
		this.db.change((d) => {
			const index = d.providers.findIndex((p) => p.id === id);
			if (index !== -1) d.providers.splice(index, 1);
		});
	}

	async edit(
		id: string,
		name: string,
		baseURL: string,
		apiKey: string | null,
	) {
		const models = await fetchModels(baseURL, apiKey).catch(() => []);

		this.db.change((d) => {
			const provider = d.providers.find((p) => p.id === id);

			if (provider) {
				provider.name = name;
				provider.baseURL = baseURL;
				provider.apiKey = apiKey;
				provider.models = models;
			}
		});
	}

	async getModelOrThrow(providerId: string | null, modelId: string | null) {
		if (!providerId || !modelId) {
			throw new Error('Provider or model ID not set');
		}

		const providers = this.current;
		const provider = providers.find((p) => p.id === providerId);
		if (!provider) throw new Error('Provider not found');

		const { createOpenAI } = await import('@ai-sdk/openai');
		const ai = createOpenAI({
			baseURL: provider.baseURL,
			apiKey: provider.apiKey ?? void 0,
		});

		return ai.chat(modelId);
	}
}
