<script lang="ts" module>
	export interface Option {
		providerId: string;
		providerName: string;
		model: Model;
	}
</script>

<script lang="ts">
	import { Providers, type Model } from '$lib/state/providers.svelte';
	import IconChevronDown from '~icons/lucide/chevron-down';
	import IconCheck from '~icons/lucide/check';
	import { Select } from 'melt/builders';

	interface Props {
		disabled: boolean;
		modelId: string | null;
		providerId: string | null;
	}

	let {
		disabled,
		modelId = $bindable(),
		providerId = $bindable(),
	}: Props = $props();

	const providers = new Providers();

	const options = $derived(
		providers.current.flatMap((provider) =>
			provider.current!.models.map(
				(model): Option => ({
					providerId: provider.id,
					providerName: provider.current!.name,
					model,
				}),
			),
		),
	);

	const groups = $derived(
		Object.groupBy(options, (option) => option.providerId),
	);

	const selected = $derived(
		options.find(
			(option) =>
				option.providerId === providerId && option.model.id === modelId,
		),
	);

	const select = new Select<Option>({
		sameWidth: false,
		value: () => selected,
		onValueChange(value) {
			modelId = value?.model.id ?? null;
			providerId = value?.providerId ?? null;
		},
	});
</script>

<div class="select">
	<label class="sr-only" {...select.label}>Model</label>

	<button {...select.trigger} {disabled} class="outline">
		<span>
			{#if select.value}
				{select.value.providerName} - {select.value.model.name}
			{:else}
				Select a model
			{/if}
		</span>

		<div class="chevron">
			<IconChevronDown width="16px" height="16px" />
		</div>
	</button>

	<div {...select.content}>
		{#each Object.values(groups) as options}
			{#if options?.length}
				<h4>{options[0].providerName}</h4>

				{#each options as option}
					<div {...select.getOption(option)}>
						<span>{option.model.name}</span>

						{#if select.isSelected(option)}
							<IconCheck
								color="var(--primary)"
								font-size="0.9rem"
							/>
						{/if}
					</div>
				{/each}
			{:else}
				<p>No models available</p>
			{/if}
		{/each}
	</div>
</div>

<style>
	.select {
		[data-melt-select-trigger] {
			display: grid;
			align-items: center;
			grid-template-columns: 1fr max-content;
			gap: 4px;

			padding: 4px 8px;
			padding-right: 2px;
			margin: 0px;

			max-width: 100%;

			span {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}

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
			box-shadow: 0px 0px 16px rgba(var(--background-primary-rgb), 0.5);
			max-height: 300px;
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
</style>
