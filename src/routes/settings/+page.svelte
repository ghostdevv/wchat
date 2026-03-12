<script lang="ts">
	import Providers from './Providers.svelte';
	import { version } from '$app/environment';
	import NameGen from './NameGen.svelte';
	import Sync from './Sync.svelte';
	import Chat from './Chat.svelte';
</script>

<div class="title">
	<h1>Settings</h1>
	<p>{version}</p>
</div>

<Providers />
<NameGen />
<Chat />
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
