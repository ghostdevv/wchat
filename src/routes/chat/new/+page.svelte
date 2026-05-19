<script lang="ts">
	import { getChatSettings } from '$lib/state/settings.svelte';
	import { sync } from '$lib/state/db.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Input from '../Input.svelte';
	import { app } from '$lib/schema';

	const db = $derived(await sync.db());
	// svelte-ignore state_referenced_locally
	const settings = await getChatSettings(db);

	let modelId = $state(settings.defaultModelId);
	let providerId = $state(settings.defaultProviderId);

	async function onSubmit(text: string) {
		const result = db.insert(app.chats, {
			name: null,
			providerId,
			modelId,
			locked: false,
			messages: [
				{
					id: crypto.randomUUID() as string,
					role: 'user',
					metadata: undefined,
					parts: [{ type: 'text', state: 'done', text }],
				},
			],
		});

		await goto(`${resolve('/chat/[id]', { id: result.value.id })}?new`);
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
