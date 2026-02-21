<script lang="ts">
	import { AccountSchema, ChatSchema } from '$lib/state/db.svelte';
	import ModelSelect, { type Option } from './ModelSelect.svelte';
	import { Providers } from '$lib/state/providers.svelte';
	import Editor from '$lib/chat/input/Editor.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import IconArrowUp from '~icons/lucide/arrow-up';
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

	let selected = $derived<Option | undefined>(
		chat?.providerId && chat.modelId
			? options.find(
					(o) =>
						o.providerId === chat?.providerId &&
						o.model.id === chat?.modelId,
				)
			: undefined,
	);

	let disabled = $state(false);
	let input = $state('');

	async function submit() {
		disabled = true;

		if (!chat) {
			if (!account.current.$isLoaded || !account.current.root.$isLoaded) {
				console.log('account not loaded');
				disabled = false;
				return;
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
		disabled = false;
		input = '';
	}
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

	<div class="input">
		<Editor bind:value={input} onSubmit={submit} {disabled} />

		<div class="controls">
			<ModelSelect
				{options}
				{disabled}
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
			/>

			<button class="outline" onclick={submit} {disabled}>
				<IconArrowUp />
			</button>
		</div>
	</div>
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

		.input {
			display: flex;
			flex-direction: column;
			border-top: 2px solid var(--background-secondary);
			padding: 6px;

			.controls {
				display: flex;
				align-items: center;
				justify-content: space-between;

				button {
					display: grid;
					place-items: center;
					font-size: 0.95rem;
					padding: 4px;
				}
			}
		}
	}
</style>
