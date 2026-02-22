<script lang="ts">
	import type { Chat } from '$lib/state/chats.svelte';
	import IconSettings from '~icons/lucide/settings';
	import { Dialog } from 'melt/builders';

	interface Props {
		chat: Chat;
	}

	const { chat }: Props = $props();
	const dialog = new Dialog();
</script>

<button class="outline" {...dialog.trigger}>
	<IconSettings />
</button>

<div {...dialog.overlay}></div>

<dialog {...dialog.content}>
	<label>
		<span>Name</span>

		<input
			type="text"
			placeholder="Brilliance written"
			bind:value={chat.name}
			disabled={chat.name === null}
		/>
	</label>
</dialog>
