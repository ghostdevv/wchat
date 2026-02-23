import { AccountCoState } from 'jazz-tools/svelte';
import { AccountSchema } from './db.svelte';

export class NameGenSettings {
	#state = new AccountCoState(AccountSchema, {
		resolve: { root: { nameGenSettings: true } },
	});

	get loading() {
		return !this.#state.current.$isLoaded;
	}

	get enabled(): boolean {
		return this.#state.current.$isLoaded
			? this.#state.current.root.nameGenSettings.enabled
			: false;
	}

	set enabled(enabled: boolean) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.nameGenSettings.$jazz.set('enabled', enabled);
	}

	set providerId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.nameGenSettings.$jazz.set('providerId', id);
	}

	get providerId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.root.nameGenSettings.providerId
			: null;
	}

	set modelId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.nameGenSettings.$jazz.set('modelId', id);
	}

	get modelId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.root.nameGenSettings.modelId
			: null;
	}

	get prompt(): string {
		return this.#state.current.$isLoaded
			? this.#state.current.root.nameGenSettings.prompt
			: '';
	}

	set prompt(prompt: string) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.nameGenSettings.$jazz.set('prompt', prompt);
	}
}

export class ChatSettings {
	#state = new AccountCoState(AccountSchema, {
		resolve: { root: { chatSettings: true } },
	});

	get loading() {
		return !this.#state.current.$isLoaded;
	}

	set defaultProviderId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.chatSettings.$jazz.set(
			'defaultProviderId',
			id,
		);
	}

	get defaultProviderId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.root.chatSettings.defaultProviderId
			: null;
	}

	set defaultModelId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.root.chatSettings.$jazz.set('defaultModelId', id);
	}

	get defaultModelId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.root.chatSettings.defaultModelId
			: null;
	}
}
