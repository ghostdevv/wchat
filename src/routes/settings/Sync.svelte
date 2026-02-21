<script lang="ts">
	import { usePassphraseAuth } from 'jazz-tools/svelte';
	import PasswordInput from '$lib/PasswordInput.svelte';
	import { sync } from '$lib/state/db.svelte';
	import { wordlist } from './wordlist';

	const auth = usePassphraseAuth({ wordlist });

	let disabled = $state(false);

	async function onsubmit(
		event: SubmitEvent & { currentTarget: HTMLFormElement },
	) {
		event.preventDefault();
		disabled = true;

		const formData = new FormData(event.currentTarget);
		const passphrase = formData.get('passphrase') as string;
		const peer = formData.get('peer') as string;

		if (!peer.startsWith('wss://')) {
			disabled = false;
			throw new Error('Invalid peer URL');
		}

		sync.peer = peer as `wss://${string}`;

		try {
			if (passphrase == auth.passphrase && auth.state === 'anonymous') {
				await auth.signUp();
			} else {
				await auth.logIn(passphrase);
			}
		} catch (error) {
			console.error(error);
		}

		disabled = false;
	}

	const authState = $derived(
		auth.state === 'signedIn' ? 'enabled' : 'disabled',
	);
</script>

<section>
	<div class="title">
		<h2>Sync</h2>

		<input
			type="checkbox"
			role="switch"
			{disabled}
			bind:checked={sync.enabled}
		/>
	</div>

	{#if sync.enabled}
		<div class="state">
			<div class={['indicator', authState]}></div>
			<p>{authState}</p>
		</div>

		<form {onsubmit}>
			<label>
				<span>Peer:</span>

				<input
					type="url"
					name="peer"
					placeholder="wss://example.com"
					value={sync.peer}
					required
					{disabled}
				/>
			</label>

			<label>
				<span>Passphrase</span>

				<PasswordInput
					name="passphrase"
					value={auth.passphrase}
					{disabled}
				/>
			</label>

			<button class="outline" {disabled}> Save </button>
		</form>
	{/if}
</section>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	label {
		width: 100%;

		input {
			margin-top: 6px;
		}
	}

	.state {
		display: flex;
		align-items: center;
		gap: 8px;
		text-transform: capitalize;

		.indicator {
			width: 10px;
			height: 10px;
			border-radius: 100%;

			&.enabled {
				background-color: var(--green);
			}

			&.disabled {
				background-color: var(--red);
			}
		}
	}
</style>
