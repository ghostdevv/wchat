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
				<li class:user={message.role === 'user'}>
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === 'text'}
							<p>{part.text}</p>
						{/if}
					{/each}
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
			overflow-y: auto;

			ul {
				list-style: none;

				li {
					&:not(:last-child) {
						margin-bottom: 22px;
					}

					&.user {
						background-color: var(--background-secondary);
						border-radius: 12px;
						font-style: italic;
						padding: 6px 12px;
						margin-left: auto;
						width: 85%;
					}
				}
			}
		}
	}
</style>
