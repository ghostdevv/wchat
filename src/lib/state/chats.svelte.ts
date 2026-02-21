import type { Providers } from './providers.svelte';
import { CoState } from 'jazz-tools/svelte';
import { ChatSchema } from './db.svelte';
import {
	convertToModelMessages,
	type ChatStatus,
	type ChatState,
	type UIMessage,
	AbstractChat,
	streamText,
} from 'ai';

class State<M extends UIMessage> implements ChatState<M> {
	messages: M[];
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();

	constructor(messages: M[] = []) {
		this.messages = $state(messages);
	}

	setMessages = (messages: M[]) => {
		this.messages = messages;
	};

	pushMessage = (message: M) => {
		this.messages.push(message);
	};

	popMessage = () => {
		this.messages.pop();
	};

	replaceMessage = (index: number, message: M) => {
		this.messages[index] = message;
	};

	snapshot = <T>(thing: T) => $state.snapshot(thing) as T;
}

export class Chat<M extends UIMessage = UIMessage> extends AbstractChat<M> {
	#state: CoState<typeof ChatSchema>;

	set providerId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.$jazz.set('providerId', id);
	}

	get providerId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.providerId
			: null;
	}

	set modelId(id: string | null) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		this.#state.current.$jazz.set('modelId', id);
	}

	get modelId(): string | null {
		return this.#state.current.$isLoaded
			? this.#state.current.modelId
			: null;
	}

	constructor(
		public readonly id: string,
		public readonly providers: Providers,
	) {
		super({
			id,
			state: new State<M>(),
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					const providerId = this.providerId;
					const modelId = this.modelId;

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
		});

		this.#state = new CoState(ChatSchema, id);
	}
}
