<script lang="ts">
	import { providers, type ProviderData } from '$lib/state/providers.svelte';
	import PasswordInput from '$lib/PasswordInput.svelte';
	import IconTrash from '~icons/lucide/trash-2';
	import IconPlus from '~icons/lucide/plus';
	import IconEdit from '~icons/lucide/edit';
	import { Dialog } from 'melt/builders';

	let editing = $state(false);
	let name = $state('');
	let baseURL = $state('');
	let apiKey = $state('');

	const dialog = new Dialog({
		onOpenChange(open) {
			if (!open) {
				editing = false;
				name = '';
				baseURL = '';
				apiKey = '';
			}
		},
	});

	function handleEdit(provider: ProviderData) {
		dialog.open = true;
		editing = true;
		name = provider.name;
		baseURL = provider.baseURL;
		apiKey = provider.apiKey ?? '';
	}

	function handleDelete(name: string) {
		if (confirm(`Are you sure you want to delete "${name}"?`)) {
			providers.remove(name);
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (editing) {
			providers.update(name, baseURL, apiKey || undefined);
		} else {
			providers.add(name, baseURL, apiKey || undefined);
		}

		dialog.open = false;
	}
</script>

<h1>Settings</h1>

<section>
	<div class="title">
		<h2>Providers</h2>
		<button class="icon" {...dialog.trigger}>
			<IconPlus />
		</button>
	</div>

	<ul class="provider-list">
		{#each providers.current as { name, provider: _provider }}
			{@const rawProvider = providers.findRaw(name)}
			<li class="provider-item">
				<div class="provider-info">
					<span class="provider-name">{name}</span>
					<span class="provider-url">{rawProvider?.baseURL}</span>
				</div>
				<div class="provider-actions">
					<button
						class="icon"
						onclick={() => handleEdit(rawProvider!)}
						title="Edit"
					>
						<IconEdit />
					</button>
					<button
						class="icon danger"
						onclick={() => handleDelete(name)}
						title="Delete"
					>
						<IconTrash />
					</button>
				</div>
			</li>
		{/each}
	</ul>

	{#if providers.current.length === 0}
		<p class="empty">No providers configured. Click + to add one.</p>
	{/if}
</section>

<div {...dialog.overlay}></div>

<dialog {...dialog.content}>
	<form onsubmit={handleSubmit}>
		<h3>{editing ? 'Edit' : 'Add'} Provider</h3>

		<label>
			Name*
			<input
				type="text"
				placeholder="llama.cpp"
				bind:value={name}
				required
			/>
		</label>

		<label>
			Base URL*
			<input
				type="url"
				placeholder="https://example.com/v1"
				bind:value={baseURL}
				required
			/>
		</label>

		<label>
			API Key
			<PasswordInput
				bind:value={apiKey}
				placeholder={editing
					? 'Leave empty to keep existing'
					: 'Optional'}
			/>
		</label>

		<div class="actions">
			<button
				type="button"
				class="secondary"
				onclick={() => (dialog.open = false)}
			>
				Cancel
			</button>

			<button type="submit">
				{editing ? 'Save' : 'Add'}
			</button>
		</div>
	</form>
</dialog>

<style>
	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.provider-list {
		list-style: none;
		padding: 0;
		margin: 16px 0 0 0;
	}

	.provider-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px;
		border: 2px solid var(--background-secondary);
		border-radius: 8px;
		margin-bottom: 8px;
	}

	.provider-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.provider-name {
		font-weight: 500;
	}

	.provider-url {
		font-size: 0.85em;
		color: var(--text-secondary);
	}

	.provider-actions {
		display: flex;
		gap: 8px;
	}

	.icon {
		padding: 8px;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: 6px;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.icon:hover {
		background: var(--background-tertiary);
		color: var(--text);
	}

	.icon.danger:hover {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
	}

	.empty {
		color: var(--text-secondary);
		font-style: italic;
	}

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

	h3 {
		margin: 0 0 16px 0;
	}

	label {
		width: 100%;
		margin-bottom: 12px;

		input {
			margin-top: 6px;
		}
	}

	.actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 16px;
	}
</style>
