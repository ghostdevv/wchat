<script lang="ts">
	import Markdown from '$lib/chat/markdown/Markdown.svelte';
	import { query, sync } from '$lib/state/db.svelte.js';
	import { toast } from '@ghostsui/svelte/toasts';
	import { Chat } from '$lib/state/chats.svelte';
	import Settings from './Settings.svelte';
	import { navigating } from '$app/state';
	import Input from '../Input.svelte';
	import { app } from '$lib/schema';
	import { onMount } from 'svelte';

	const { params } = $props();

	const db = $derived(await sync.db());
	const q = $derived(await query(db, app.chats.where({ id: params.id })));
	const chat = $derived(new Chat(params.id, db, q));

	async function handleNewChat(messageId: string) {
		try {
			await chat.regenerate({ messageId });
			await chat.generateName();
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `failed to handle new chat: ${message}`);
		}
	}

	onMount(() => {
		const newChat = navigating.from?.route.id === '/chat/new';
		if (newChat && chat.messages.length === 1) {
			const lastMessage = chat.lastMessage;

			if (lastMessage?.role === 'user') {
				handleNewChat(lastMessage.id);
			}
		}
	});
</script>

<ul>
	{#each chat.messages.toReversed() as message (message.id)}
		<li class:user={message.role === 'user'}>
			{#each message.parts as part, partIndex (partIndex)}
				{#if part.type === 'text'}
					<Markdown text={part.text} />
				{/if}
			{/each}
		</li>
	{/each}

	{#if chat.error}
		<li class="error">
			{chat.error}
		</li>
	{/if}
</ul>

<Input
	disabled={chat.loading}
	bind:modelId={chat.modelId}
	bind:providerId={chat.providerId}
	onSubmit={async (text) => await chat.sendMessage({ text })}
>
	<Settings {chat} />
</Input>

<style>
	ul {
		list-style: none;
		overflow-y: auto;
		padding: 4px 10px;

		display: flex;
		flex-direction: column-reverse;

		> li {
			display: block;

			&:not(:last-child) {
				margin-bottom: 22px;
			}

			&.user {
				background-color: var(--background-secondary);
				border-radius: 12px;
				font-style: italic;
				padding: 12px;
				margin-left: auto;
				width: 85%;

				:global(> .markdown > *) {
					&:first-child {
						margin-top: 0px;
					}

					&:last-child {
						margin-bottom: 0px;
					}
				}
			}

			&.error {
				color: var(--red);
			}
		}
	}
</style>
