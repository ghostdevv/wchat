<script lang="ts">
	import { Providers } from '$lib/state/providers.svelte';
	import { Chat } from '$lib/state/chats.svelte';
	import { navigating } from '$app/state';
	import Input from '../Input.svelte';

	const { params } = $props();
	const providers = new Providers();
	const chat = $derived(new Chat(params.id, providers));

	const newChat = navigating.from?.route.id === '/chat/new';
	$effect(() => {
		if (newChat && !chat.loading && chat.messages.length === 1) {
			const lastMessage = chat.lastMessage;

			if (lastMessage?.role === 'user') {
				chat.regenerate({ messageId: lastMessage.id });
			}
		}
	});
</script>

<ul>
	{#each chat.messages as message (message.id)}
		<li class:user={message.role === 'user'}>
			{#each message.parts as part, partIndex (partIndex)}
				{#if part.type === 'text'}
					<p>{part.text}</p>
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
	onSubmit={async (text) => {
		await chat.sendMessage({ text });
		return true;
	}}
/>

<style>
	ul {
		list-style: none;
		overflow-y: auto;

		li {
			&:not(:last-child) {
				margin-bottom: 22px;
			}

			&.user {
				background-color: var(--background-secondary);
				border-radius: 12px;
				font-style: italic;
				padding: 6px 12px;
				margin-left: auto;
				width: 85%;
			}

			&.error {
				color: var(--red);
			}
		}
	}
</style>
