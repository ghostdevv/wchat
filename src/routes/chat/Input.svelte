<script lang="ts">
	import Editor from '$lib/chat/editor/Editor.svelte';
	import ModelSelect from '$lib/ModelSelect.svelte';
	import IconArrowUp from '~icons/lucide/arrow-up';
	import type { Snippet } from 'svelte';

	interface Props {
		modelId: string | null;
		providerId: string | null;
		children?: Snippet;
		onSubmit: (text: string) => Promise<boolean>;
		disabled?: boolean;
	}

	let {
		modelId = $bindable(),
		providerId = $bindable(),
		children,
		...props
	}: Props = $props();

	let submitting = $state(false);
	let input = $state('');

	async function onSubmit() {
		if (!input.trim()) return;
		submitting = true;
		const success = await props.onSubmit(input.trim());
		if (success) input = '';
		submitting = false;
	}

	const submitDisabled = $derived(!modelId || !providerId);
	const disabled = $derived(submitting || !!props.disabled);
</script>

<div class="input">
	<Editor
		bind:value={input}
		{onSubmit}
		disabled={disabled || submitDisabled}
	/>

	<div class="controls">
		<ModelSelect bind:modelId bind:providerId {disabled} />

		{@render children?.()}

		<button
			class="outline"
			onclick={onSubmit}
			disabled={disabled || submitDisabled || !input.trim()}
		>
			<IconArrowUp />
		</button>
	</div>
</div>

<style>
	.input {
		display: flex;
		flex-direction: column;
		border-top: 2px solid var(--background-secondary);
		padding: 6px;

		.controls {
			display: flex;
			align-items: center;

			> :global(:nth-child(2)) {
				margin-left: auto;
			}

			> :global(button) {
				display: grid;
				place-items: center;
				font-size: 0.95rem;
				padding: 4px;
			}
		}
	}
</style>
