<script lang="ts">
	import { type AuthState, BrowserAuthSecretStore } from 'jazz-tools';
	import { PasswordInput } from '@ghostsui/svelte/password';
	import { PUBLIC_JAZZ_APP_ID } from '$env/static/public';
	import { RecoveryPhrase } from 'jazz-tools/passphrase';
	import { online } from 'svelte/reactivity/window';
	import { toast } from '@ghostsui/svelte/toasts';
	import IconEyeOff from '~icons/lucide/eye-off';
	import { sync } from '$lib/state/db.svelte';
	import IconEye from '~icons/lucide/eye';

	const db = $derived(await sync.db());

	let saving = $state(false);
	const disabled = $derived(saving || $effect.pending() > 0);

	async function onsubmit(
		event: SubmitEvent & { currentTarget: HTMLFormElement },
	) {
		event.preventDefault();
		saving = true;

		const formData = new FormData(event.currentTarget);
		const phrase = formData.get('phrase')?.toString()?.trim();

		try {
			if (phrase && phrase !== (await getRecoveryPhrase())) {
				const secret = RecoveryPhrase.toSecret(phrase);
				// prettier-ignore
				await BrowserAuthSecretStore.saveSecret(secret, { appId: PUBLIC_JAZZ_APP_ID });
				toast('success', 'Recovery Phrase updated! Reloading...');
				location.reload();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `failed to signup/login: ${message}`);
		}

		saving = false;
	}

	async function getRecoveryPhrase() {
		// prettier-ignore
		const secret = await BrowserAuthSecretStore.loadSecret({ appId: PUBLIC_JAZZ_APP_ID });
		return secret ? RecoveryPhrase.fromSecret(secret) : null;
	}

	let authState = $state<AuthState>();

	$effect(() => {
		return db.onAuthChanged((state) => {
			authState = state;
		});
	});
</script>

<section>
	<h2>Database</h2>

	<form {onsubmit}>
		<PasswordInput
			{disabled}
			iconOn={IconEye}
			iconOff={IconEyeOff}
			value={await getRecoveryPhrase()}
			label="Recovery Phrase"
			name="phrase"
			required
		/>

		<button class="outline" {disabled}> Save </button>
	</form>

	<div class="title">
		<h3>Sync</h3>

		<input
			type="checkbox"
			role="switch"
			{disabled}
			bind:checked={sync.enabled}
		/>
	</div>

	{#if sync.enabled}
		<div class="state">
			<div
				class={[
					'indicator',
					online.current ? 'connected' : 'disconnected',
				]}
			></div>
			<p>{online.current ? 'Online' : 'Offline'}</p>
		</div>

		<p>Server URL: <code>{db.getConfig().serverUrl}</code></p>

		<pre><code>{JSON.stringify(authState, null, 2)}</code></pre>
	{/if}
</section>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
	}

	form {
		display: grid;
		grid-template-rows: repeat(2, max-content);
		grid-template-columns: 1fr max-content;
		gap: 6px 0px;

		margin-top: 8px;

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
