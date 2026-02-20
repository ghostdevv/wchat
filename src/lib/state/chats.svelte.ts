import type { Providers } from './providers.svelte';
import { Chat as SdkChat } from '@ai-sdk/svelte';
import { PersistedState } from 'runed';
import { untrack } from 'svelte';
import {
	convertToModelMessages,
	type UIDataTypes,
	type UIMessage,
	type UITools,
	streamText,
} from 'ai';

type Message = UIMessage<unknown, UIDataTypes, UITools>;

interface ChatState {
	providerId: string | null;
	modelId: string | null;
	messages: Message[];
}

export class Chat {
	#state: PersistedState<ChatState>;
	#sdk: SdkChat;

	get messages(): Message[] {
		return this.#state.current.messages;
	}

	set providerId(value: string | null) {
		this.#state.current.providerId = value;
	}

	get providerId(): string | null {
		return this.#state.current.providerId;
	}

	set modelId(value: string | null) {
		this.#state.current.modelId = value;
	}

	get modelId(): string | null {
		return this.#state.current.modelId;
	}

	constructor(
		public readonly id: string,
		public readonly providers: Providers,
	) {
		this.#state = new PersistedState<ChatState>(`wchat::chat::${id}`, {
			providerId: null,
			modelId: null,
			messages: [],
		});

		this.#sdk = new SdkChat({
			id,
			messages: untrack(() => this.#state.current.messages),
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					this.#state.current.messages = messages;
					const { providerId, modelId } = this.#state.current;

					if (!providerId || !modelId) {
						throw new Error('Provider or model ID not set');
					}

					const provider = providers.current.find(
						(p) => p.id === providerId,
					);

					if (!provider) {
						throw new Error('Provider not found');
					}

					const stream = streamText({
						model: provider.chatModel(modelId),
						messages: await convertToModelMessages(messages),
						abortSignal,
					});

					return stream.toUIMessageStream();
				},
				reconnectToStream() {
					throw new Error('todo');
				},
			},
			onFinish: ({ messages }) => {
				this.#state.current.messages = messages;
			},
		});
	}

	async send(text: string) {
		await this.#sdk.sendMessage({ text });
	}
}

class Chats {
	// #chatIds = new PersistedState<string[]>('wchat::chats', []);
	#cache = new Map<string, Chat>();

	get(id: string, providers: Providers) {
		// if (!this.#chatIds.current.includes(id)) {
		// 	this.#chatIds.current.push(id);
		// }

		const current = this.#cache.get(id);
		if (current) return current;

		const chat = new Chat(id, providers);
		this.#cache.set(id, chat);
		return chat;
	}
}

export const chats = new Chats();
