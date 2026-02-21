<script lang="ts">
	import Input, { type Option } from '$lib/chat/input/Input.svelte';
	import { AccountSchema, ChatSchema } from '$lib/state/db.svelte';
	import { Providers } from '$lib/state/providers.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { Chat } from '$lib/state/chats.svelte';
	import { tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const { params } = $props();

	const providers = new Providers();

	const options = $derived(
		providers.current.flatMap((provider) =>
			provider.current!.models.map(
				(model): Option => ({
					providerId: provider.id,
					providerName: provider.current!.name,
					model,
				}),
			),
		),
	);

	const account = new AccountCoState(AccountSchema, {
		resolve: { root: { chats: { $each: true } } },
	});

	let chat = $state<Chat | null>(null);

	$effect(() => {
		chat =
			params.id === 'new'
				? null
				: untrack(() => new Chat(params.id, providers));
	});

	let selected = $state<Option>();
</script>

<div class="chat">
	<div class="content">
		{#if chat}
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
		{/if}
	</div>

	<Input
		{options}
		bind:selected={
			() => selected,
			(value) => {
				selected = value;

				if (chat) {
					chat.providerId = selected?.providerId ?? null;
					chat.modelId = selected?.model.id ?? null;
				}
			}
		}
		onSubmit={async (input) => {
			if (!chat) {
				if (
					!account.current.$isLoaded ||
					!account.current.root.$isLoaded
				) {
					console.log('account not loaded');
					return false;
				}

				const c = ChatSchema.create({
					providerId: selected?.providerId ?? null,
					modelId: selected?.model.id ?? null,
				});

				account.current.root.chats.$jazz.push(c);
				const id = c.$jazz.id;

				await goto(resolve('/chat/[id]', { id }), {
					replaceState: true,
				});

				await tick();
			}

			await chat!.sendMessage({ text: input });
			return true;
		}}
	/>
</div>

<style>
	.chat {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr max-content;
		height: 100%;

		.content {
			padding: 10px 12px;
			overflow-y: auto;

			ul {
				list-style: none;

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
		}
	}
</style>
