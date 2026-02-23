<script lang="ts">
	import { ChatSettings } from '$lib/state/settings.svelte';
	import ModelSelect from '$lib/ModelSelect.svelte';

	const settings = new ChatSettings();
</script>

<section>
	<h2>Chat Defaults</h2>

	<label class="model">
		Default Model
		<ModelSelect
			bind:modelId={settings.defaultModelId}
			bind:providerId={settings.defaultProviderId}
			disabled={settings.loading}
		/>
	</label>
</section>

<style>
	.model {
		display: flex;
		flex-direction: column;
		gap: 6px;

		margin-bottom: 16px;
	}
</style>
