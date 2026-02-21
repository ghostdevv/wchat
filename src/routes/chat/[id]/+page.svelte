<script lang="ts">
	import { Providers } from '$lib/state/providers.svelte';
	import { Chat } from '$lib/state/chats.svelte';
	import { goto } from '$app/navigation';
	import Input from '../Input.svelte';
	import { page } from '$app/state';

	const { params } = $props();
	const providers = new Providers();
	const chat = $derived(new Chat(params.id, providers));

	$effect(() => {
		if (page.url.searchParams.has('new')) {
			page.url.searchParams.delete('new');
			goto(page.url, { replaceState: true });
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
