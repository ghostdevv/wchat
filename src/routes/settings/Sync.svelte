<script lang="ts">
	import { isValidAutomergeUrl } from '@automerge/automerge-repo';
	import { PasswordInput } from '@ghostsui/svelte/password';
	import { toast } from '@ghostsui/svelte/toasts';
	import IconEyeOff from '~icons/lucide/eye-off';
	import { dbm } from '$lib/state/db.svelte';
	import IconEye from '~icons/lucide/eye';

	let disabled = $state(false);

	async function onsubmit(
		event: SubmitEvent & { currentTarget: HTMLFormElement },
	) {
		event.preventDefault();
		disabled = true;

		const formData = new FormData(event.currentTarget);
		const url = formData.get('url') as string;

		if (!isValidAutomergeUrl(url)) {
			toast('error', 'url is not a valid automerge url');
			disabled = false;
			return;
		}

		dbm.url = url;
		disabled = false;
		toast('success', 'updated database url!');
	}
</script>

<section>
	<h2>Database</h2>

	<form {onsubmit}>
		<PasswordInput
			{disabled}
			iconOn={IconEye}
			iconOff={IconEyeOff}
			value={dbm.url}
			label="Automerge URL"
			name="url"
			required
		/>

		<button class="outline" {disabled}> Save </button>
	</form>
</section>

<style>
	form {
		display: grid;
		grid-template-rows: repeat(2, max-content);
		grid-template-columns: 1fr max-content;
		align-items: center;
		gap: 6px 0px;

		button {
			grid-row: 2;
			grid-column: 2;
		}

		:global(label) {
			grid-row: 1;
			grid-column: 1 / span 2;
		}

		:global(.password-input) {
			margin-top: 0px;
		}
	}
</style>
