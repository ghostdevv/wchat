<script lang="ts">
	import type { Chat } from '$lib/state/chats.svelte';
	import IconSettings from '~icons/lucide/settings';
	import IconSparkles from '~icons/lucide/sparkles';
	import { Modal } from '@ghostsui/svelte/modal';

	interface Props {
		chat: Chat;
	}

	const { chat }: Props = $props();
</script>

<Modal>
	{#snippet activator(attrs)}
		<button class="outline" {...attrs}>
			<IconSettings />
		</button>
	{/snippet}

	<label for="name"> Name </label>

	<div class="name">
		<input
			id="name"
			type="text"
			placeholder="Brilliance written"
			bind:value={chat.name}
			disabled={chat.name === null}
		/>

		<button
			class="icon"
			onclick={() => chat.generateName()}
			disabled={chat.generatingName}
		>
			<IconSparkles />
		</button>
	</div>
</Modal>

<style>
	.name {
		position: relative;
		margin-top: 8px;

		button {
			position: absolute;
			inset: 0 10px 0 auto;

			opacity: 0.5;
			transition:
				opacity 0.2s ease-in-out,
				color 0.2s ease-in-out;

			&:hover,
			&:focus {
				opacity: 1;
			}
		}
	}
</style>
