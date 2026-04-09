import type { Database } from './db.svelte';

export interface SettingsData {
	nameGen: {
		enabled: boolean;
		providerId: string | null;
		modelId: string | null;
		prompt: string;
	};
	chat: {
		defaultProviderId: string | null;
		defaultModelId: string | null;
	};
}

export class NameGenSettings {
	constructor(private readonly db: Database) {}

	get enabled(): boolean {
		return this.db.current.settings.nameGen.enabled;
	}

	set enabled(value: boolean) {
		this.db.change((d) => {
			d.settings.nameGen.enabled = value;
		});
	}

	get providerId(): string | null {
		return this.db.current.settings.nameGen.providerId;
	}

	set providerId(value: string | null) {
		this.db.change((d) => {
			d.settings.nameGen.providerId = value;
		});
	}

	get modelId(): string | null {
		return this.db.current.settings.nameGen.modelId;
	}

	set modelId(value: string | null) {
		this.db.change((d) => {
			d.settings.nameGen.modelId = value;
		});
	}

	get prompt(): string {
		return this.db.current.settings.nameGen.prompt;
	}

	set prompt(value: string) {
		this.db.change((d) => {
			d.settings.nameGen.prompt = value;
		});
	}
}

export class ChatSettings {
	constructor(private readonly db: Database) {}

	get defaultProviderId(): string | null {
		return this.db.current.settings.chat.defaultProviderId;
	}

	set defaultProviderId(value: string | null) {
		this.db.change((d) => {
			d.settings.chat.defaultProviderId = value;
		});
	}

	get defaultModelId(): string | null {
		return this.db.current.settings.chat.defaultModelId;
	}

	set defaultModelId(value: string | null) {
		this.db.change((d) => {
			d.settings.chat.defaultModelId = value;
		});
	}
}

export class Settings {
	constructor(private readonly db: Database) {}

	#chat: ChatSettings | null = null;
	get chat() {
		this.#chat ??= new ChatSettings(this.db);
		return this.#chat;
	}

	#nameGen: NameGenSettings | null = null;
	get nameGen() {
		this.#nameGen ??= new NameGenSettings(this.db);
		return this.#nameGen;
	}
}
