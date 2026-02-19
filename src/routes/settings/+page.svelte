<script lang="ts">
	import { providers } from '$lib/state/providers.svelte';
	import AddProvider from './AddProvider.svelte';
</script>

<h1>Settings</h1>

<section>
	<div class="title">
		<h2>Providers</h2>
		<AddProvider />
	</div>

	<ul>
		{#each providers.current as provider}
			<li>{provider.name}</li>
		{/each}
	</ul>
</section>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>
