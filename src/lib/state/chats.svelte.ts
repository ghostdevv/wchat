import type { Providers } from './providers.svelte';
import { NameGenSettings } from './settings.svelte';
import { CoState } from 'jazz-tools/svelte';
import { ChatSchema } from './db.svelte';
import { untrack } from 'svelte';
import { dequal } from 'dequal';
import {
	convertToModelMessages,
	type ModelMessage,
	type ChatStatus,
	type ChatState,
	type UIMessage,
	generateText,
	AbstractChat,
	streamText,
} from 'ai';

class State<M extends UIMessage> implements ChatState<M> {
	messages: M[];
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();

	constructor(
		private onChange: (messages: M[]) => void,
		messages: M[] = [],
	) {
		this.messages = $state(messages);
	}

	setMessages = (messages: M[]) => {
		this.messages = messages;
	};

	pushMessage = (message: M) => {
		this.messages.push(message);
		// oxlint-disable-next-line typescript-eslint(no-explicit-any)
		this.onChange($state.snapshot(this.messages as any));
	};

	popMessage = () => {
		this.messages.pop();
		// oxlint-disable-next-line typescript-eslint(no-explicit-any)
		this.onChange($state.snapshot(this.messages as any));
	};

	replaceMessage = (index: number, message: M) => {
		this.messages[index] = message;
		// oxlint-disable-next-line typescript-eslint(no-explicit-any)
		this.onChange($state.snapshot(this.messages as any));
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

	get name(): string | null | undefined {
		return this.#state.current.$isLoaded ? this.#state.current.name : null;
	}

	set name(name: string | undefined) {
		if (!this.#state.current.$isLoaded) {
			throw new Error('chat is not loaded');
		}

		// oxlint-disable-next-line eslint(no-undefined)
		this.#state.current.$jazz.set('name', name || undefined);
	}

	get loading() {
		return (
			!this.#state.current.$isLoaded ||
			this.#state.current.locked ||
			this.status !== 'ready'
		);
	}

	get messages(): M[] {
		return this.#state.current.$isLoaded
			? (this.#state.current.messages as unknown as M[])
			: [];
	}

	constructor(
		public readonly id: string,
		public readonly providers: Providers,
	) {
		super({
			id,
			state: new State<M>(onChange),
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					const model = this.providers.getModelOrThrow(
						this.providerId,
						this.modelId,
					);

					const stream = streamText({
						messages: await convertToModelMessages(messages),
						abortSignal,
						model,
					});

					return stream.toUIMessageStream();
				},
				reconnectToStream() {
					throw new Error('todo');
				},
			},
		});

		const state = new CoState(ChatSchema, id);
		this.#state = state;

		this.#nameSettings = new NameGenSettings();

		function onChange(messages: M[]) {
			if (!state.current.$isLoaded) return;
			// oxlint-disable-next-line typescript-eslint(no-explicit-any)
			state.current.$jazz.set('messages', messages as any);
		}

		$effect(() => {
			const locked = this.status !== 'ready';

			untrack(() => {
				if (
					this.#state.current.$isLoaded &&
					this.#state.current.locked !== locked
				) {
					this.#state.current.$jazz.set('locked', locked);
				}
			});
		});

		$effect(() => {
			const { current } = this.#state;

			if (current.$isLoaded) {
				untrack(() => {
					const db = $state.snapshot<unknown>(current.messages);
					const local = $state.snapshot<unknown>(super.messages);
					if (dequal(db, local)) return;
					super.messages = db;
				});
			}
		});
	}

	generatingName = $state(false);
	#nameSettings: NameGenSettings;

	async generateName() {
		if (!this.#state.current.$isLoaded) {
			throw new Error('Chat is not loaded');
		}

		const prompt = this.#nameSettings.prompt.trim();

		if (!prompt) {
			throw new Error('No prompt provided');
		}

		const model = this.providers.getModelOrThrow(
			this.#nameSettings.providerId,
			this.#nameSettings.modelId,
		);

		if (this.generatingName) {
			throw new Error('Name generation already in progress');
		}

		this.generatingName = true;

		const message = this.messages.find(
			(message) =>
				message.role === 'user' &&
				message.parts.some((p) => p.type === 'text') &&
				message.parts.length > 0,
		);

		if (!message) {
			this.generatingName = false;
			throw new Error('No user message found');
		}

		const { text } = await generateText({
			model,
			maxOutputTokens: 32,
			messages: [
				{
					role: 'system',
					content: prompt,
				},
				...message.parts
					.filter((part) => part.type === 'text')
					.map(
						(part): ModelMessage => ({
							role: 'user',
							content: part.text,
						}),
					),
			],
		});

		if (this.#state.current.$isLoaded) {
			this.#state.current.$jazz.set('name', text);
		}

		this.generatingName = false;
	}
}
