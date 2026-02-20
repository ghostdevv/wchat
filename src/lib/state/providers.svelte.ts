import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { AccountCoState, CoState } from 'jazz-tools/svelte';
import {
	type Provider as ProviderData,
	ProviderSchema,
	AccountSchema,
} from './db.svelte';

export interface Model {
	id: string;
	name: string;
}

export class Provider {
	#state: CoState<typeof ProviderSchema>;
	public readonly current: ProviderData | null;

	get ready() {
		return this.#state.current.$isLoaded;
	}

	constructor(public readonly id: string) {
		this.#state = new CoState(ProviderSchema, id);
		this.current = $derived(
			this.#state.current.$isLoaded ? this.#state.current : null,
		);
	}

	update(name?: string, baseURL?: string, apiKey?: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('provider is not loaded');
		}

		if (name) {
			this.#state.current.$jazz.set('name', name);
		}

		if (baseURL) {
			this.#state.current.$jazz.set('baseURL', baseURL);
		}

		if (typeof apiKey !== 'undefined') {
			this.#state.current.$jazz.set('apiKey', apiKey);
		}
	}

	#ai: OpenAIProvider | null = null;

	chatModel(id: string) {
		this.#ai ??= createOpenAI({
			baseURL: this.current?.baseURL,
			// oxlint-disable-next-line eslint(no-undefined)
			apiKey: this.current?.apiKey ?? undefined,
		});

		return this.#ai.chat(id);
	}

	static async fetchModels(baseURL: string, apiKey?: string | null) {
		const url = new URL(baseURL);
		url.pathname += '/models';

		const headers = new Headers();
		if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);

		const result = await fetch(url, { headers });
		const json: { data: Model[] } = await result.json();

		return json.data;
	}
}

export class Providers {
	#providers = new AccountCoState(AccountSchema, {
		resolve: { root: { providers: { $each: true } } },
	});

	#cache = new Map<string, Provider>();

	get ready() {
		return this.#providers.current.$isLoaded;
	}

	public readonly current = $derived(
		this.raw.map((data) => {
			const current = this.#cache.get(data.$jazz.id);
			if (current) return current;

			const provider = new Provider(data.$jazz.id);
			this.#cache.set(data.$jazz.id, provider);
			return provider;
		}),
	);

	private get raw() {
		return this.#providers.current.$isLoaded
			? this.#providers.current.root.providers
			: [];
	}

	async create(name: string, baseURL: string, apiKey: string | null) {
		if (!this.#providers.current.$isLoaded) {
			throw new Error('providers are not ready');
		}

		const models = await Provider.fetchModels(baseURL, apiKey).catch(
			(error): Model[] => {
				console.error('Failed to fetch models:', error);
				return [];
			},
		);

		this.#providers.current.root.providers.$jazz.push({
			type: 'openai',
			name,
			baseURL,
			apiKey,
			models,
		});
	}

	delete(id: string) {
		if (!this.#providers.current.$isLoaded) {
			throw new Error('providers are not ready');
		}

		this.#providers.current.root.providers.$jazz.remove(
			(p) => p.$jazz.id === id,
		);

		this.#cache.delete(id);
	}
}
