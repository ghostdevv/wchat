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

async function fetchModels(
	baseURL: string,
	apiKey?: string | null,
): Promise<Model[]> {
	const url = new URL(baseURL);
	url.pathname += '/models';

	const headers = new Headers();
	if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);

	const result = await fetch(url, { headers });
	const json: { data: { id: string; name?: string }[] } = await result.json();

	return json.data.map((m) => ({ id: m.id, name: m.name ?? m.id }));
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

	public refreshingModels = $state(false);

	async refreshModels() {
		if (!this.#state.current.$isLoaded) {
			throw new Error('provider is not loaded');
		}

		this.refreshingModels = true;

		try {
			const models = await fetchModels(
				this.#state.current.baseURL,
				this.#state.current.apiKey,
			);

			this.#state.current.$jazz.set('models', models);
		} catch (error) {
			console.error(error);
		}

		this.refreshingModels = false;
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

		const models = await fetchModels(baseURL, apiKey).catch(
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

	getModelOrThrow(providerId: string | null, modelId: string | null) {
		if (!providerId || !modelId) {
			throw new Error('Provider or model ID not set');
		}

		const provider = this.current.find((p) => p.id === providerId);
		if (!provider) throw new Error('Provider not found');

		return provider.chatModel(modelId);
	}
}
