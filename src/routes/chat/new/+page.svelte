<script lang="ts">
	import { dbm } from '$lib/state/db.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Input from '../Input.svelte';

	const db = $derived(await dbm.db());

	// svelte-ignore state_referenced_locally
	let modelId = $state(db.settings.chat.defaultModelId);
	// svelte-ignore state_referenced_locally
	let providerId = $state(db.settings.chat.defaultProviderId);

	async function onSubmit(text: string) {
		const chat = db.chats.create([
			{
				id: crypto.randomUUID(),
				role: 'user',
				parts: [{ type: 'text', state: 'done', text }],
			},
		]);

		await goto(`${resolve('/chat/[id]', { id: chat.id })}?new`);
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
		height: 100%;
		overflow-y: auto;

		img {
			border-radius: 12px;
		}
	}
</style>
