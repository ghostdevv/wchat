<script lang="ts">
	import { streamText, convertToModelMessages } from 'ai';
	import { providers } from '$lib/state/providers.svelte';
	import Input from '$lib/chat/input/Input.svelte';
	import { Chat } from '@ai-sdk/svelte';

	const { params } = $props();

	let providerName = $state<string | null>(null);
	let modelId = $state<string | null>(null);

	const chat = new Chat({
		get id() {
			return params.id;
		},
		transport: {
			async sendMessages({ messages, abortSignal }) {
				if (!providerName || !modelId) {
					throw new Error('Provider or model ID not set');
				}

				const { provider } = providers.findProvider(providerName);

				const stream = streamText({
					model: provider.chat(modelId),
					messages: await convertToModelMessages(messages),
					abortSignal,
				});

				return stream.toUIMessageStream();
			},
			async reconnectToStream() {
				throw new Error('todo');
			},
		},
	});
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

	<Input
		bind:modelId
		bind:providerName
		onSubmit={(message) => {
			chat.sendMessage({
				text: message,
			});
		}}
	/>
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
