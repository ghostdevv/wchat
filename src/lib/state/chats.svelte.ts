import deepMapValues from 'just-deep-map-values';
import type { Database } from './db.svelte';
import { dset } from 'dset/merge';
import { diff } from 'just-diff';
import { dequal } from 'dequal';
import merge from 'just-merge';
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

type Message = UIMessage<unknown>;

export interface ChatData {
	id: string;
	name: string | null;
	providerId: string | null;
	modelId: string | null;
	locked: boolean;
	messages: Message[];
}

export class Chats {
	constructor(private readonly db: Database) {}

	get current(): Readonly<Record<string, Readonly<ChatData>>> {
		return this.db.current.chats;
	}

	create(messages?: UIMessage[]) {
		const chat: ChatData = {
			id: crypto.randomUUID(),
			name: null,
			providerId: this.db.settings.chat.defaultProviderId,
			modelId: this.db.settings.chat.defaultModelId,
			messages: messages ?? [],
			locked: false,
		};

		this.db.change((d) => {
			d.chats[chat.id] = chat;
		});

		return chat;
	}

	delete(id: string) {
		this.db.change((d) => {
			// oxlint-disable-next-line typescript/no-dynamic-delete
			delete d.chats[id];
		});
	}
}

function change<A extends object, B extends object>(a: A, b: B) {
	for (const change of diff(a, b)) {
		console.log('  change', change.op, change.path, change.value);
		// oxlint-disable-next-line default-case
		switch (change.op) {
			case 'add':
				dset(a, change.path, change.value);
				break;

			case 'remove':
				// oxlint-disable-next-line unicorn/no-useless-undefined,no-undefined
				dset(a, change.path, null);
				break;

			case 'replace':
				dset(a, change.path, change.value);
				break;
		}
	}
}

function clean<T extends object | unknown[]>(obj: T): T {
	if (Array.isArray(obj)) {
		for (const item of obj) {
			if (typeof item === 'object') {
				clean(item);
			}
		}
	} else {
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === 'undefined') {
				// @ts-expect-error shh
				// oxlint-disable-next-line typescript/no-dynamic-delete
				delete obj[key];
			} else if (typeof value === 'object') {
				clean(value as T);
			}
		}
	}

	return obj;
}

class State<M extends UIMessage> implements ChatState<M> {
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();

	constructor(
		private id: string,
		private db: Database,
	) {}

	get messages() {
		return this.db.current.chats[this.id].messages as M[];
	}

	set messages(messages: M[]) {
		// @ts-expect-error shh
		// oxlint-disable-next-line no-param-reassign
		messages = $state.snapshot(messages);

		if (dequal(this.db.current.chats[this.id].messages, messages)) return;

		this.db.change((d) => {
			console.log('set messages', messages);
			for (let i = 0; i < messages.length; i++) {
				const message = messages[i];
				const existing = d.chats[this.id].messages.at(i);

				if (existing) {
					console.log('  changed', existing.id, message.id);
					change(existing, message);
				} else {
					console.log('  pushed');
					d.chats[this.id].messages.push(message);
				}
			}

			if (d.chats[this.id].messages.length !== messages.length) {
				console.log('  trimmed');
				d.chats[this.id].messages.slice(0, messages.length);
			}
		});
	}

	setMessages = (messages: M[]) => {
		console.log('setMessages', messages);
		this.messages = messages;
	};

	pushMessage = (message: M) => {
		console.log('pushMessage', message, clean(message));
		this.db.change((d) => {
			d.chats[this.id].messages.push(clean(message));
		});
	};

	popMessage = () => {
		console.log('popMessage');
		this.db.change((d) => d.chats[this.id].messages.pop());
	};

	replaceMessage = (index: number, message: M) => {
		console.log('replaceMessage', index, message);
		this.db.change((d) => {
			change(d.chats[this.id].messages[index], clean(message));
		});
	};

	snapshot = <T>(thing: T) => $state.snapshot(thing) as T;
}

class State2<M extends UIMessage> implements ChatState<M> {
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();
	#messages = $state<M[]>([]);

	constructor(
		private id: string,
		private db: Database,
	) {}

	get messages() {
		return this.#messages;
	}

	set messages(messages: M[]) {
		console.log('set messages', messages);
		this.#messages = messages;
	}

	setMessages = (messages: M[]) => {
		console.log('setMessages', messages);
		this.messages = messages;
	};

	pushMessage = (message: M) => {
		console.log('pushMessage', message, clean(message));
		this.#messages.push(message);
	};

	popMessage = () => {
		console.log('popMessage');
		this.#messages.pop();
	};

	replaceMessage = (index: number, message: M) => {
		console.log('replaceMessage', index, message);
		this.#messages[index] = message;
	};

	snapshot = <T>(thing: T) => $state.snapshot(thing) as T;
}

class State3<M extends UIMessage> implements ChatState<M> {
	status = $state<ChatStatus>('ready');
	error = $state<Error | undefined>();
	#messages = $state<M[]>([]);

	constructor(
		private id: string,
		private db: Database,
	) {}

	get messages() {
		return this.db.current.chats[this.id].messages as M[];
	}

	set messages(messages: M[]) {
		const equal = dequal(this.messages, messages);
		console.log('set messages', messages, equal);

		if (!equal) {
			this.db.change((d) => {
				change(d.chats[this.id].messages, messages);
			});
		}
	}

	setMessages = (messages: M[]) => {
		console.log('setMessages', messages);
		this.messages = messages;
	};

	pushMessage = (message: M) => {
		console.log('pushMessage', message, clean(message));
		this.db.change((d) => {
			d.chats[this.id].messages.push(clean(message));
		});
	};

	popMessage = () => {
		console.log('popMessage');
		this.db.change((d) => {
			d.chats[this.id].messages.pop();
		});
	};

	replaceMessage = (index: number, message: M) => {
		console.log('replaceMessage', index, message);
		this.db.change((d) =>
			change(d.chats[this.id].messages[index], message),
		);
	};

	snapshot = <T>(thing: T) => $state.snapshot(thing) as T;
}

export class Chat<M extends UIMessage = Message> extends AbstractChat<M> {
	get providerId(): string | null {
		return this.db.current.chats[this.id].providerId;
	}

	set providerId(id: string | null) {
		this.db.change((d) => (d.chats[this.id].providerId = id));
	}

	get modelId(): string | null {
		return this.db.current.chats[this.id].modelId;
	}

	set modelId(id: string | null) {
		this.db.change((d) => (d.chats[this.id].modelId = id));
	}

	get name(): string | null | undefined {
		return this.db.current.chats[this.id].name;
	}

	set name(name: string | null) {
		this.db.change((d) => (d.chats[this.id].name = name));
	}

	get messages() {
		return this.state.messages;
		// return this.db.current.chats[this.id].messages as M[];
	}

	constructor(
		public readonly id: string,
		private readonly db: Database,
	) {
		super({
			id,
			// state: new State<M>(id, db),
			// state: new State2<M>(id, db),
			state: new State3<M>(id, db),
			onError(error) {
				console.log('chat error', error);
			},
			transport: {
				sendMessages: async ({ messages, abortSignal }) => {
					const model = await this.db.providers.getModelOrThrow(
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

		$inspect(this.state.messages).with((t, u) => console.log('==', t, u));
	}

	generatingName = $state(false);

	async generateName() {
		const prompt = this.db.settings.nameGen.prompt.trim();

		if (!prompt) {
			throw new Error('No prompt provided');
		}

		const model = await this.db.providers.getModelOrThrow(
			this.providerId,
			this.modelId,
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

		this.name = text;
		this.generatingName = false;
	}
}
