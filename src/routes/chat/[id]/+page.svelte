<script lang="ts">
	import Input from '$lib/chat/input/Input.svelte';
	import { chats } from '$lib/state/chats.svelte';

	const { params } = $props();

	const chat = $derived(chats.get(params.id));
</script>

<div class="chat">
	<div class="content">
		<ul>
			{#each chat.messages as message (message.id)}
				<li>
					<div>{message.role}</div>
					<div>
						{#each message.parts as part, partIndex (partIndex)}
							{#if part.type === 'text'}
								<div>{part.text}</div>
							{/if}
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<Input {chat} />
</div>

<style>
	.chat {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr max-content;
		height: 100%;

		.content {
			padding: 10px 12px;
		}
	}
</style>
