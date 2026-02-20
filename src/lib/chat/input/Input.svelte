<script lang="ts">
	import { Providers, type Model } from '$lib/state/providers.svelte';
	import IconChevronDown from '~icons/lucide/chevron-down';
	import type { Chat } from '$lib/state/chats.svelte';
	import IconArrowUp from '~icons/lucide/arrow-up';
	import IconCheck from '~icons/lucide/check';
	import { Select } from 'melt/builders';
	import Editor from './Editor.svelte';
	import { untrack } from 'svelte';

	interface Props {
		providers: Providers;
		chat: Chat;
	}

	const { chat, providers }: Props = $props();

	interface Option {
		providerId: string;
		providerName: string;
		model: Model;
	}

	const groupedOptions = $derived(
		providers.current.map(
			// prettier-ignore
			(provider): [id: string, name: string, options: Option[] | null] => [
				provider.id,
				provider.current!.name,
				provider.current?.models.map(
					(model): Option => ({
						providerId: provider.id,
						providerName: provider.current!.name,
						model,
					}),
				) ?? null,
			],
		),
	);

	function findInitialValue() {
		if (!chat.providerId) return undefined;

		const g = groupedOptions.find(([id]) => id === chat.providerId);
		if (!g) return undefined;

		const option = g[2]?.find((option) => option.model.id === chat.modelId);
		return option;
	}

	const select = new Select<Option>({
		sameWidth: false,
		value: untrack(findInitialValue),
		onValueChange(value) {
			chat.modelId = value?.model.id ?? null;
			chat.providerId = value?.providerId ?? null;
		},
	});

	let input = $state('');

	function submit() {
		chat.send(input);
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
				{#each groupedOptions as [, name, options]}
					<h4>{name}</h4>

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
