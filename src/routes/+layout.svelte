<script lang="ts">
	import 'ghostsui';
	import IconGripVertical from '~icons/lucide/grip-vertical';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import { Toasts } from '@ghostsui/svelte/toasts';
	import favicon from '$lib/assets/favicon.svg';
	import IconClose from '~icons/lucide/x';
	import Sidebar from './Sidebar.svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	let isDragging = $state(false);
	let collapsed = $state(false);
	let innerWidth = $state(0);

	const panelMin = $derived(Math.ceil((200 / innerWidth) * 100));
	const isChatPage = $derived(page.route.id?.startsWith('/chat'));

	const title = $derived.by(() => {
		switch (page.route.id) {
			case '/chat/[id]':
				return 'chat ~ wchat';
			case '/settings':
				return 'settings ~ wchat';
			case '/chat/new':
				return 'new ~ wchat';
			default:
				return 'wchat';
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title}</title>
</svelte:head>

<svelte:window bind:innerWidth />

<Toasts closeIcon={IconClose} />

<div class="wrapper">
	<PaneGroup direction="horizontal">
		<Pane
			defaultSize={panelMin}
			minSize={panelMin}
			onCollapse={() => (collapsed = true)}
			onExpand={() => (collapsed = false)}
			collapsible
		>
			<Sidebar />
		</Pane>

		<PaneResizer class="resizer" onDraggingChange={(v) => (isDragging = v)}>
			<div class="resizer-grip" class:active={isDragging} class:collapsed>
				<IconGripVertical />
			</div>
		</PaneResizer>

		<Pane minSize={33}>
			<main class:chat={isChatPage}>
				<svelte:boundary>
					{@render children()}
					{#snippet pending()}
						<div class="loading-overlay">Loading...</div>
					{/snippet}
					{#snippet failed(error, reset)}
						<div class="error-overlay">
							<p>
								Something went wrong: {error instanceof Error
									? error.message
									: error}
							</p>
							<button onclick={reset}>Try again</button>
						</div>
					{/snippet}
				</svelte:boundary>
			</main>
		</Pane>
	</PaneGroup>
</div>

<style>
	.wrapper {
		width: 100dvw;
		max-width: 1800px;
		height: 100dvh;

		padding: 10px;
		margin: 0 auto;
	}

	main {
		width: 100%;
		height: 100%;
		overflow-y: auto;

		border: 2px solid var(--background-secondary);
		border-radius: 12px;

		:global(> *:first-child) {
			margin-top: 0px;
		}

		&.chat {
			padding: 0px;
		}
	}

	:global(.pane-reverse) {
		flex-direction: column-reverse !important;
	}

	:global(.resizer) {
		display: flex;
		align-items: center;
		justify-content: center;

		&:focus .resizer-grip {
			background-color: var(--primary);
		}
	}

	.resizer-grip {
		display: flex;
		align-items: center;
		justify-content: center;

		background-color: var(--background-tertiary);
		border-radius: 4px;
		z-index: 1000;

		transition: background-color 0.2s ease-in-out;

		padding: 6px 2px;
		margin: 0px -4px;

		&.collapsed {
			margin-right: -11px;
			margin-left: 0px;
		}

		&:hover,
		&:active,
		&.active {
			background-color: var(--primary);
		}
	}

	.loading-overlay {
		display: grid;
		place-items: center;
		height: 100%;
		color: var(--text-secondary);
		padding: 20px;
	}

	.error-overlay {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 20px;
		text-align: center;

		p {
			color: var(--red);
		}
	}
</style>
