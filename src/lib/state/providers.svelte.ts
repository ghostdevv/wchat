import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { PersistedState } from 'runed';

export interface ProviderData {
	type: 'openai-compatible';
	name: string;
	baseURL: string;
	apiKey?: string;
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

	add(name: string, baseURL: string, apiKey?: string) {
		if (this.#providers.current.some((p) => p.name === name)) {
			throw new Error(`Provider with name '${name}' already exists`);
		}

		this.#providers.current.push({
			type: 'openai-compatible',
			name,
			baseURL,
			apiKey,
		});
	}

	private findRaw(name: string) {
		return this.#providers.current.find((p) => p.name === name) ?? null;
	}

	findProvider(raw: string | ProviderData) {
		const data = typeof raw === 'string' ? this.findRaw(raw) : raw;
		if (!data) throw new Error(`Provider with name '${raw}' not found`);

		const provider = this.#cache.get(data.name) ?? createOpenAI(data);
		this.#cache.set(data.name, provider);
		return { name: data.name, provider };
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
