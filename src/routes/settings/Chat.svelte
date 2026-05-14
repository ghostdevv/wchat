<script lang="ts">
	import ModelSelect from '$lib/ModelSelect.svelte';
	import { dbm } from '$lib/state/db.svelte';

	const db = $derived(await dbm.db());
</script>

<section>
	<h2>Chat Defaults</h2>

	<label class="model">
		Default Model
		<ModelSelect
			bind:modelId={db.settings.chat.defaultModelId}
			bind:providerId={db.settings.chat.defaultProviderId}
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
