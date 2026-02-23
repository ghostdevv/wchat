<script lang="ts">
	import Markdown from '$lib/chat/markdown/Markdown.svelte';
	import { Providers } from '$lib/state/providers.svelte';
	import { toast } from '@ghostsui/svelte/toasts';
	import { Chat } from '$lib/state/chats.svelte';
	import Settings from './Settings.svelte';
	import { navigating } from '$app/state';
	import Input from '../Input.svelte';

	const { params } = $props();
	const providers = new Providers();
	const chat = $derived(new Chat(params.id, providers));

	async function handleNewChat(messageId: string) {
		try {
			await chat.regenerate({ messageId });
			await chat.generateName();
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `failed to handle new chat: ${message}`);
		}
	}

	const newChat = navigating.from?.route.id === '/chat/new';
	$effect(() => {
		if (newChat && !chat.loading && chat.messages.length === 1) {
			const lastMessage = chat.lastMessage;

			if (lastMessage?.role === 'user') {
				handleNewChat(lastMessage.id);
			}
		}
	});
</script>

<ul>
	{#each chat.messages as message (message.id)}
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
