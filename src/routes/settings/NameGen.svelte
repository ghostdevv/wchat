<script lang="ts">
	import ModelSelect from '$lib/ModelSelect.svelte';
	import { dbm } from '$lib/state/db.svelte';

	const db = $derived(await dbm.db());
</script>

<section>
	<div class="title">
		<h2>Name Generation</h2>

		<input
			type="checkbox"
			role="switch"
			bind:checked={db.settings.nameGen.enabled}
		/>
	</div>

	{#if db.settings.nameGen.enabled}
		<label class="model">
			Model
			<ModelSelect
				bind:modelId={db.settings.nameGen.modelId}
				bind:providerId={db.settings.nameGen.providerId}
			/>
		</label>

		<label>
			Prompt
			<textarea
				placeholder="Make no mistakes"
				bind:value={db.settings.nameGen.prompt}
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
