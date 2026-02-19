import { Chat as SdkChat } from '@ai-sdk/svelte';
import { providers } from './providers.svelte';
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
	providerName: string | null;
	modelId: string | null;
	messages: Message[];
}

export class Chat {
	#state: PersistedState<ChatState>;
	#sdk: SdkChat;

	get messages(): Message[] {
		return this.#state.current.messages;
	}

	set providerName(value: string | null) {
		this.#state.current.providerName = value;
	}

	get providerName(): string | null {
		return this.#state.current.providerName;
	}

	set modelId(value: string | null) {
		this.#state.current.modelId = value;
	}

	get modelId(): string | null {
		return this.#state.current.modelId;
	}

	constructor(public readonly id: string) {
		this.#state = new PersistedState<ChatState>(`wchat::chat::${id}`, {
			providerName: null,
			modelId: null,
			messages: [],
		});

		this.#sdk = new SdkChat({
			id,
			messages: untrack(() => this.#state.current.messages),
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					this.#state.current.messages = messages;
					const { providerName, modelId } = this.#state.current;

					if (!providerName || !modelId) {
						throw new Error('Provider or model ID not set');
					}

					const { provider } = providers.findProvider(providerName);

					const stream = streamText({
						model: provider.chat(modelId),
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

	get(id: string) {
		// if (!this.#chatIds.current.includes(id)) {
		// 	this.#chatIds.current.push(id);
		// }

		const current = this.#cache.get(id);
		if (current) return current;

		const chat = new Chat(id);
		this.#cache.set(id, chat);
		return chat;
	}
}

export const chats = new Chats();
