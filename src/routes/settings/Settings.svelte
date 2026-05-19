<script lang="ts">
	import { useSettings } from '$lib/state/settings.svelte';
	import ModelSelect from '$lib/ModelSelect.svelte';
	import { sync } from '$lib/state/db.svelte';

	const db = $derived(await sync.db());
	const settings = $derived(await useSettings(db));
</script>

<section>
	<h2>Chat Defaults</h2>

	<label class="model">
		Default Model
		<ModelSelect
			bind:modelId={settings.chat.defaultModelId}
			bind:providerId={settings.chat.defaultProviderId}
		/>
	</label>
</section>

<section>
	<div class="title">
		<h2>Name Generation</h2>
		<input
			type="checkbox"
			role="switch"
			bind:checked={settings.nameGen.enabled}
		/>
	</div>

	{#if settings.nameGen.enabled}
		<label class="model">
			Model
			<ModelSelect
				bind:modelId={settings.nameGen.modelId}
				bind:providerId={settings.nameGen.providerId}
			/>
		</label>

		<label>
			Prompt
			<textarea
				placeholder="Make no mistakes"
				bind:value={settings.nameGen.prompt}
			></textarea>
		</label>
	{/if}
</section>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.model {
		display: flex;
		flex-direction: column;
		gap: 6px;

		margin-bottom: 16px;
	}
</style>
