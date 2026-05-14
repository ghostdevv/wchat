<script lang="ts">
	import type { Provider } from '$lib/state/providers.svelte';
	import { PasswordInput } from '@ghostsui/svelte/password';
	import IconRefresh from '~icons/lucide/refresh-cw';
	import { toast } from '@ghostsui/svelte/toasts';
	import IconEyeOff from '~icons/lucide/eye-off';
	import { Modal } from '@ghostsui/svelte/modal';
	import IconTrash from '~icons/lucide/trash-2';
	import { dbm } from '$lib/state/db.svelte';
	import IconPlus from '~icons/lucide/plus';
	import IconEdit from '~icons/lucide/edit';
	import IconEye from '~icons/lucide/eye';

	const db = $derived(await dbm.db());

	let editing = $state<Provider | false>(false);
	let saving = $state(false);

	let id = $state('');
	let name = $state('');
	let baseURL = $state('');
	let apiKey = $state<string | null>(null);

	const disabled = $derived(saving);

	let open = $state(false);

	function onClose() {
		editing = false;
		id = '';
		name = '';
		baseURL = '';
		apiKey = null;
	}

	function handleEdit(provider: Provider) {
		open = true;
		editing = provider;
		id = provider.id;
		name = provider.name;
		baseURL = provider.baseURL;
		apiKey = provider.apiKey;
	}

	function handleDelete(id: string) {
		if (confirm(`Are you sure you want to delete "${name}"?`)) {
			db.providers.delete(id);
			toast('success', 'provider deleted successfully');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;

		try {
			if (editing) {
				await db.providers.edit(id, name, baseURL, apiKey);
			} else {
				await db.providers.create(name, baseURL, apiKey);
			}

			toast(
				'success',
				`provider ${editing ? 'edited' : 'created'} successfully`,
			);

			open = false;
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;

			toast(
				'error',
				`failed to ${editing ? 'edit' : 'create'} provider: ${message}`,
			);
		}

		saving = false;
	}

	async function refreshModels(_provider: Provider) {
		try {
			// await provider.refreshModels();
			toast('success', 'models refreshed successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`;
			toast('error', `failed to refresh models: ${message}`);
		}
	}
</script>

<section>
	<div class="title">
		<h2>Providers</h2>

		<Modal bind:open {onClose}>
			{#snippet activator(attrs)}
				<button class="icon" {...attrs}>
					<IconPlus />
				</button>
			{/snippet}

			<form onsubmit={handleSubmit}>
				<h3>{editing ? 'Edit' : 'Add'} Provider</h3>

				<label>
					Name*
					<input
						type="text"
						placeholder="llama.cpp"
						bind:value={name}
						required
						{disabled}
					/>
				</label>

				<label>
					Base URL*
					<input
						type="url"
						placeholder="https://example.com/v1"
						bind:value={baseURL}
						required
						{disabled}
					/>
				</label>

				<PasswordInput
					{disabled}
					iconOn={IconEye}
					iconOff={IconEyeOff}
					bind:value={apiKey}
					label="API Key"
					placeholder={editing
						? 'Leave empty to keep existing'
						: 'Optional'}
				/>

				<div class="actions">
					<button
						type="button"
						class="outline"
						onclick={() => (open = false)}
						{disabled}
					>
						Cancel
					</button>

					<button type="submit" {disabled}>
						{editing ? 'Save' : 'Add'}
					</button>
				</div>
			</form>
		</Modal>
	</div>

	<ul class="providers">
		{#each db.providers.current as provider (provider.id)}
			{@const providerDisabled = disabled}

			<li class="provider">
				<h4 class="name">{provider.name}</h4>
				<p class="url">{provider.baseURL}</p>

				<div class="actions">
					<button
						class="icon"
						onclick={() => handleEdit(provider)}
						title="Edit"
						disabled={providerDisabled}
					>
						<IconEdit />
					</button>

					<button
						class="icon danger"
						onclick={() => handleDelete(provider.id)}
						title="Delete"
						disabled={providerDisabled}
					>
						<IconTrash />
					</button>
				</div>

				<div class="models">
					<div class="title">
						<h5>
							Models <sup class="amount">
								{provider.models.length ?? 0}
							</sup>
						</h5>

						<button
							class="icon"
							onclick={() => refreshModels(provider)}
							title="Refresh Models"
							disabled={providerDisabled}
						>
							<IconRefresh font-size="0.85rem" />
						</button>
					</div>

					<ul>
						{#each provider.models ?? [] as model}
							<li>{model.name}</li>
						{:else}
							<li>No models found</li>
						{/each}
					</ul>
				</div>
			</li>
		{:else}
			<li class="empty">No providers configured. Click + to add one.</li>
		{/each}
	</ul>
</section>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	section {
		margin-top: 8px;
	}

	.providers {
		list-style: none;

		.provider {
			display: grid;
			grid-template-columns: 1fr max-content;
			grid-template-rows: repeat(3, max-content);
			grid-template-areas: 'name actions' 'url actions' 'models models';
			align-items: center;

			padding: 12px;
			border: 2px solid var(--background-secondary);
			border-radius: 8px;
			margin-bottom: 8px;

			.name {
				font-weight: 500;
				margin: 0px;
				grid-area: name;
			}

			.url {
				font-size: 0.85rem;
				color: var(--text-secondary);
				margin: 0px;
				grid-area: url;
			}

			.actions {
				display: flex;
				grid-area: actions;
				align-items: center;
				margin: 0px;
				gap: 8px;
			}

			.models {
				grid-area: models;
				border-top: 2px solid var(--background-tertiary);
				padding-top: 6px;
				margin-top: 12px;

				.title .amount {
					font-size: 0.85rem;
					color: var(--text-grey);
					vertical-align: middle;
				}

				ul {
					max-height: 300px;
					overflow-y: auto;
				}
			}
		}
	}

	.icon {
		padding: 8px;

		&:hover,
		&.danger:hover {
			background-color: var(--background-tertiary);
		}

		&:hover,
		&:focus {
			color: var(--text);
		}

		&.danger:hover,
		&.danger:focus {
			color: var(--red);
		}
	}

	.empty {
		color: var(--text-secondary);
		font-style: italic;
	}

	h3 {
		margin: 0 0 16px 0;
	}

	label {
		margin-bottom: 12px;
	}

	.actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 16px;
	}
</style>
