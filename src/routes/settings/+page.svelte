<script lang="ts">
	import { version } from '$app/environment';
	import Providers from './Providers.svelte';
	import Settings from './Settings.svelte';
	import Sync from './Sync.svelte';
</script>

<div class="title">
	<h1>Settings</h1>
	<p>{version}</p>
</div>

<Providers />
<Settings />
<Sync />

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;

		p {
			color: var(--text-grey);
		}
	}
</style>
