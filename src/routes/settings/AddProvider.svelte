<script lang="ts">
	import { providers } from '$lib/state/providers.svelte';
	import IconPlus from '~icons/lucide/plus';
	import { Dialog } from 'melt/builders';

	const dialog = new Dialog();

	function onsubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		const baseURL = formData.get('baseURL') as string;
		const apiKey = formData.get('apiKey') as string;

		providers.add(name, baseURL, apiKey);
		event.currentTarget.reset();
		dialog.open = false;
	}
</script>

<button class="icon" {...dialog.trigger}>
	<IconPlus />
</button>

<div {...dialog.overlay}></div>

<dialog {...dialog.content}>
	<form {onsubmit}>
		<label>
			Name*
			<input type="text" name="name" required placeholder="llama.cpp" />
		</label>

		<label>
			Base URL*
			<input
				type="url"
				name="baseURL"
				required
				placeholder="https://example.com/v1"
			/>
		</label>

		<label>
			API Key
			<input
				type="password"
				name="apiKey"
				placeholder="*******************"
			/>
		</label>

		<button class="secondary"> Add </button>
	</form>
</dialog>

<style>
	dialog {
		padding: 18px;
		border-radius: 12px;

		color: var(--text);
		background: var(--background-primary);
		border: 2px solid var(--background-secondary);
		box-shadow: 0px 0px 16px rgba(var(--background-tertiary-rgb), 0.3);

		opacity: 0;
		scale: 0.95;
		transition:
			opacity 0.2s ease-in,
			scale 0.2s ease-in;

		&::backdrop {
			display: none;
		}

		&[data-open] {
			opacity: 1;
			scale: 1;
		}
	}

	[data-melt-dialog-overlay] {
		position: fixed;
		width: 100%;
		height: 100%;

		background: rgba(18, 18, 20, 0.8);
		transition: opacity 0.2s ease-in;
		opacity: 0;

		&[data-open] {
			opacity: 1;
		}
	}

	label {
		width: 100%;

		input {
			margin-top: 6px;
		}
	}
</style>
