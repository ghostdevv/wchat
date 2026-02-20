<script lang="ts">
	import PasswordInput from '$lib/PasswordInput.svelte';
	import IconTrash from '~icons/lucide/trash-2';
	import IconPlus from '~icons/lucide/plus';
	import IconEdit from '~icons/lucide/edit';
	import { Dialog } from 'melt/builders';
	import {
		type ProviderData,
		type Model,
		providers,
	} from '$lib/state/providers.svelte';

	let editing = $state(false);
	let name = $state('');
	let baseURL = $state('');
	let apiKey = $state<string | null>(null);
	let models = $state<Model[] | null>(null);

	const dialog = new Dialog({
		onOpenChange(open) {
			if (!open) {
				editing = false;
				name = '';
				baseURL = '';
				apiKey = null;
				models = null;
			}
		},
	});

	function handleEdit(provider: ProviderData) {
		dialog.open = true;
		editing = true;
		name = provider.name;
		baseURL = provider.baseURL;
		apiKey = provider.apiKey;
		models = provider.models;
	}

	function handleDelete(name: string) {
		if (confirm(`Are you sure you want to delete "${name}"?`)) {
			providers.remove(name);
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (editing) {
			providers.update(name, baseURL, models ?? [], apiKey);
		} else {
			providers.add(name, baseURL, models ?? [], apiKey);
		}

		dialog.open = false;
	}

	async function fetchModels(provider: ProviderData, force = false) {
		if (!force && provider.models) return provider.models;
		provider.models = await providers.fetchModels(provider.name);
		return provider.models;
	}
</script>

<section>
	<div class="title">
		<h2>Providers</h2>
		<button class="icon" {...dialog.trigger}>
			<IconPlus />
		</button>
	</div>

	<ul class="providers">
		{#each providers.current as { name }}
			{@const rawProvider = providers.findRaw(name)!}

			<li class="provider">
				<h4 class="name">{name}</h4>
				<p class="url">{rawProvider.baseURL}</p>

				<div class="actions">
					<button
						class="icon"
						onclick={() => handleEdit(rawProvider)}
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

				<div class="models">
					{#await fetchModels(rawProvider)}
						<p>Loading...</p>
					{:then models}
						<ul>
							{#each models as model}
								<li>{model.name}</li>
							{:else}
								<li>No models found</li>
							{/each}
						</ul>
					{:catch error}
						<p>Error: {error.message}</p>
					{/await}
				</div>
			</li>
		{:else}
			<li class="empty">No providers configured. Click + to add one.</li>
		{/each}
	</ul>
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
