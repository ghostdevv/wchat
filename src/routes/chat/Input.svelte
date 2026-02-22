<script lang="ts">
	import Editor from '$lib/chat/input/Editor.svelte';
	import IconArrowUp from '~icons/lucide/arrow-up';
	import ModelSelect from './ModelSelect.svelte';

	interface Props {
		modelId: string | null;
		providerId: string | null;
		onSubmit: (text: string) => Promise<boolean>;
		disabled?: boolean;
	}

	let {
		modelId = $bindable(),
		providerId = $bindable(),
		...props
	}: Props = $props();

	let submitting = $state(false);
	let input = $state('');

	async function onSubmit() {
		submitting = true;
		const success = await props.onSubmit(input);
		if (success) input = '';
		submitting = false;
	}

	const disabled = $derived((submitting || props.disabled) ?? false);
</script>

<div class="input">
	<Editor bind:value={input} {disabled} {onSubmit} />

	<div class="controls">
		<ModelSelect {disabled} bind:modelId bind:providerId />

		<button class="outline" onclick={onSubmit} {disabled}>
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
			justify-content: space-between;

			button {
				display: grid;
				place-items: center;
				font-size: 0.95rem;
				padding: 4px;
			}
		}
	}
</style>
