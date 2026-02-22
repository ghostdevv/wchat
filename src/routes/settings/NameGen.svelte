<script lang="ts">
	import { NameGenSettings } from '$lib/state/settings.svelte';
	import ModelSelect from '$lib/ModelSelect.svelte';

	const settings = new NameGenSettings();
</script>

<section>
	<div class="title">
		<h2>Name Generation</h2>

		<input
			type="checkbox"
			role="switch"
			disabled={settings.loading}
			bind:checked={settings.enabled}
		/>
	</div>

	{#if settings.enabled}
		<label class="model">
			Model
			<ModelSelect
				bind:modelId={settings.modelId}
				bind:providerId={settings.providerId}
				disabled={settings.loading}
			/>
		</label>

		<label>
			Prompt
			<textarea
				placeholder="Make no mistakes"
				disabled={settings.loading}
				bind:value={settings.prompt}
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
