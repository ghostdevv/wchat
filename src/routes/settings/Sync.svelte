<script lang="ts">
	import { getJazzContext, usePassphraseAuth } from 'jazz-tools/svelte';
	import { sync, type Peer } from '$lib/state/db.svelte';
	import PasswordInput from '$lib/PasswordInput.svelte';
	import { toast } from '@ghostsui/svelte/toasts';
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

		if (!peer.startsWith('wss://') && !peer.startsWith('ws://')) {
			disabled = false;
			toast('error', 'Invalid peer URL');
			return;
		}

		sync.peer = peer as Peer;

		try {
			if (passphrase == auth.passphrase && auth.state === 'anonymous') {
				await auth.signUp();
			} else {
				await auth.logIn(passphrase);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `failed to signup/login: ${message}`);
		}

		disabled = false;
	}

	const jazz = getJazzContext();
	let connected = $state(jazz.current.connected());

	const authState = $derived(
		auth.state === 'signedIn' && connected ? 'connected' : 'disconnected',
	);

	$effect(() => {
		return jazz.current.addConnectionListener((c) => {
			connected = c;
		});
	});
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

	.state {
		display: flex;
		align-items: center;
		gap: 8px;
		text-transform: capitalize;

		.indicator {
			width: 10px;
			height: 10px;
			border-radius: 100%;

			&.connected {
				background-color: var(--green);
			}

			&.disconnected {
				background-color: var(--red);
			}
		}
	}
</style>
