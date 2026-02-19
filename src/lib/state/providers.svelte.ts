import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { PersistedState } from 'runed';

export interface ProviderData {
	type: 'openai-compatible';
	name: string;
	baseURL: string;
	apiKey: string | null;
	models: Model[];
}

export interface Model {
	id: string;
	name: string;
}

class Providers {
	#providers = new PersistedState<ProviderData[]>('wchat::providers', []);
	#cache = new Map<string, OpenAIProvider>();

	get current() {
		return this.#providers.current.map((data) => this.findProvider(data));
	}

	add(name: string, baseURL: string, models: Model[], apiKey: string | null) {
		if (this.#providers.current.some((p) => p.name === name)) {
			throw new Error(`Provider with name '${name}' already exists`);
		}

		this.#providers.current.push({
			type: 'openai-compatible',
			name,
			baseURL,
			apiKey,
			models,
		});
	}

	update(
		name: string,
		baseURL: string,
		models: Model[],
		apiKey: string | null,
	) {
		const index = this.#providers.current.findIndex((p) => p.name === name);
		if (index === -1) {
			throw new Error(`Provider with name '${name}' not found`);
		}

		this.#providers.current[index] = {
			type: 'openai-compatible',
			name,
			baseURL,
			apiKey: apiKey && apiKey.length > 0 ? apiKey : null,
			models,
		};

		this.#cache.delete(name);
	}

	remove(name: string) {
		const index = this.#providers.current.findIndex((p) => p.name === name);
		if (index === -1) {
			throw new Error(`Provider with name '${name}' not found`);
		}

		this.#providers.current.splice(index, 1);
		this.#cache.delete(name);
	}

	findRaw(name: string) {
		return this.#providers.current.find((p) => p.name === name) ?? null;
	}

	findProvider(raw: string | ProviderData) {
		const data = typeof raw === 'string' ? this.findRaw(raw) : raw;
		if (!data) throw new Error(`Provider with name '${raw}' not found`);

		// @ts-expect-error todo
		const provider = this.#cache.get(data.name) ?? createOpenAI(data);
		this.#cache.set(data.name, provider);
		return { name: data.name, models: data.models, provider };
	}

	async fetchModels(name: string) {
		const provider = this.findRaw(name);

		if (!provider) {
			throw new Error(`Provider with name '${name}' not found`);
		}

		const url = new URL(provider.baseURL);
		url.pathname += '/models';

		const headers = new Headers();
		if (provider.apiKey) {
			headers.set('Authorization', `Bearer ${provider.apiKey}`);
		}

		const result = await fetch(url, { headers });
		const json: { data: Model[] } = await result.json();

		return json.data;
	}
}

export const providers = new Providers();
