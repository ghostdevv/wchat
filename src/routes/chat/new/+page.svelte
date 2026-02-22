<script lang="ts">
	import { AccountSchema, ChatSchema } from '$lib/state/db.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Input from '../Input.svelte';

	const account = new AccountCoState(AccountSchema, {
		resolve: { root: { chats: { $each: true } } },
	});

	let modelId = $state<string | null>(null);
	let providerId = $state<string | null>(null);

	async function onSubmit(text: string) {
		if (!account.current.$isLoaded || !account.current.root.$isLoaded) {
			console.log('account not loaded');
			return false;
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

		return true;
	}
</script>

<div></div>

<Input bind:modelId bind:providerId {onSubmit} />

<style>
</style>
