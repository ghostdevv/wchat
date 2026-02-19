<script lang="ts">
	import { providers, type Model } from '$lib/state/providers.svelte';
	import IconChevronDown from '~icons/lucide/chevron-down';
	import IconArrowUp from '~icons/lucide/arrow-up';
	import IconCheck from '~icons/lucide/check';
	import { Select } from 'melt/builders';
	import Editor from './Editor.svelte';

	interface Props {
		onSubmit?: (message: string) => void;
		providerName: string | null;
		modelId: string | null;
	}

	let {
		onSubmit,
		providerName = $bindable(),
		modelId = $bindable(),
	}: Props = $props();

	interface Option {
		name: string;
		model: Model;
	}

	const select = new Select<Option>({
		sameWidth: false,
		onValueChange(value) {
			modelId = value?.model.id ?? null;
			providerName = value?.name ?? null;
		},
	});

	let input = $state('');

	function submit() {
		onSubmit?.(input);
		input = '';
	}
</script>

<div class="input">
	<Editor bind:value={input} onSubmit={submit} />

	<div class="controls">
		<div class="select">
			<label class="sr-only" {...select.label}>Model</label>

			<button {...select.trigger} class="outline">
				<span>
					{#if select.value}
						{select.value.name} - {select.value.model.name}
					{:else}
						Select a model
					{/if}
				</span>

				<div class="chevron">
					<IconChevronDown width="16px" height="16px" />
				</div>
			</button>

			<div {...select.content}>
				{#each providers.current as { name }}
					<h4>{name}</h4>

					{#await providers.fetchModels(name)}
						<p>Loading...</p>
					{:then models}
						{#each models as model}
							{@const option: Option = { name, model }}

							<div {...select.getOption(option)}>
								<span>{model.name}</span>

								{#if select.isSelected(option)}
									<IconCheck
										color="var(--primary)"
										font-size="0.9rem"
									/>
								{/if}
							</div>
						{/each}
					{:catch error}
						<p>{error}</p>
					{/await}
				{/each}
			</div>
		</div>

		<button class="outline" onclick={submit}>
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

			.select {
				[data-melt-select-trigger] {
					display: flex;
					align-items: center;
					gap: 4px;

					padding: 4px 8px;
					padding-right: 2px;

					.chevron {
						display: grid;
						place-items: center;
						transition: transform 0.1s ease-in-out;
					}

					&[aria-expanded='true'] .chevron {
						transform: rotate(180deg);
					}
				}

				[data-melt-select-content] {
					padding: 4px 6px;
					color: var(--text);
					background: var(--background-primary);
					border: 2px solid var(--background-secondary);
					border-radius: 12px;
					cursor: pointer;
					box-shadow: 0px 0px 16px
						rgba(var(--background-primary-rgb), 0.5);
				}

				[data-melt-select-option] {
					display: flex;
					align-items: center;
					gap: 24px;

					padding: 6px;
					border-radius: 8px;
					margin-block: 4px;

					transition: background-color 0.2s ease-in-out;

					&[data-highlighted] {
						background: var(--background-secondary);
					}
				}
			}

			button {
				display: grid;
				place-items: center;
				font-size: 0.95rem;
				padding: 4px;
			}
		}
	}
</style>
