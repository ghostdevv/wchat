import { getNameGenSettings } from './settings.svelte';
import { app, type ChatData } from '$lib/schema';
import { toast } from '@ghostsui/svelte/toasts';
import { getModel } from './providers.svelte';
import type { LiveQuery } from './db.svelte';
import type { Db } from 'jazz-tools';
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

export type Message = UIMessage<unknown>;

class State implements ChatState<Message> {
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();
	messages: Message[];

	constructor(
		private readonly id: string,
		private readonly db: Db,
		query: LiveQuery<ChatData>,
	) {
		this.messages = query.current[0].messages;
	}

	private sync() {
		this.db.update(app.chats, this.id, {
			messages: $state.snapshot(this.messages) as Message[],
		});
	}

	setMessages = (messages: Message[]) => {
		this.messages = messages;
		this.sync();
	};

	pushMessage = (message: Message) => {
		this.messages.push(message);
		this.sync();
	};

	popMessage = () => {
		this.messages.pop();
		this.sync();
	};

	replaceMessage = (index: number, message: Message) => {
		this.messages[index] = message;
		this.sync();
	};

	snapshot = <T>(thing: T) => $state.snapshot(thing) as T;
}

export class Chat extends AbstractChat<Message> {
	get providerId(): string | null {
		return this.query.current[0].providerId;
	}

	set providerId(providerId: string | undefined) {
		this.db.update(app.chats, this.id, { providerId });
	}

	get modelId(): string | null {
		return this.query.current[0].modelId;
	}

	set modelId(modelId: string | null) {
		this.db.update(app.chats, this.id, { modelId });
	}

	get name(): string | null {
		return this.query.current[0].name;
	}

	set name(name: string | undefined) {
		this.db.update(app.chats, this.id, { name });
	}

	get messages(): Message[] {
		return this.state.messages;
	}

	get loading() {
		return this.query.current[0].locked || this.status !== 'ready';
	}

	constructor(
		public readonly id: string,
		public readonly db: Db,
		private readonly query: LiveQuery<ChatData>,
	) {
		super({
			id,
			state: new State(id, db, query),
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					const model = await getModel(this.providerId, this.modelId);

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

		// this is broken and I don't feel like figuring it out rn
		// $effect(() => {
		// 	const locked = this.status !== 'ready';
		// 	if (this.query.current[0].locked !== locked) {
		// 		console.log('set locked', locked);
		// 		this.db.update(app.chats, this.id, { locked });
		// 	}
		// });
	}

	public generatingName = $state(false);

	async generateName() {
		try {
			const settings = await getNameGenSettings(this.db);
			if (!settings.enabled) return;

			if (!settings.prompt) {
				throw new Error('No prompt provided');
			}

			const model = await getModel(settings.providerId, settings.modelId);

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
				providerOptions: {
					openai: {
						reasoningEffort: 'none',
					},
				},
				messages: [
					{
						role: 'system',
						content: settings.prompt,
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

			if (text) {
				this.name = text;
			} else {
				throw new Error('No name generated');
			}

			this.generatingName = false;
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `Failed to generate session name: ${message}`);
		}
	}
}
