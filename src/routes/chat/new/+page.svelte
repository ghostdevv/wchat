<script lang="ts">
	import { AccountSchema, ChatSchema } from '$lib/state/db.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Input from '../Input.svelte';
	import { toast } from '@ghostsui/svelte/toasts';

	const account = new AccountCoState(AccountSchema, {
		resolve: { root: { chats: { $each: true } } },
	});

	let modelId = $state<string | null>(null);
	let providerId = $state<string | null>(null);

	async function onSubmit(text: string) {
		if (!account.current.$isLoaded || !account.current.root.$isLoaded) {
			throw new Error('account not loaded');
		}

		const chat = ChatSchema.create({
			providerId,
			modelId,
			locked: false,
			messages: [
				{
					role: 'user',
					parts: [{ type: 'text', state: 'done', text }],
				},
			],
		});

		account.current.root.chats.$jazz.push(chat);
		await goto(`${resolve('/chat/[id]', { id: chat.$jazz.id })}?new`);
	}
</script>

<div>
	<img
		src="https://wsrv.nl/?url=https://www.explainxkcd.com/wiki/images/b/bb/turing_test.png&filt=negate&w=250&cx=1%&cy=1%&cw=98%&ch=98%"
		alt="xkcd #329"
	/>
</div>

<Input bind:modelId bind:providerId {onSubmit} />

<style>
	div {
		display: grid;
		place-items: center;

		img {
			border-radius: 12px;
		}
	}
</style>
