<script lang="ts">
	import 'ghostsui';
	import IconGripVertical from '~icons/lucide/grip-vertical';
	import { AccountSchema, sync } from '$lib/state/db.svelte';
	import { Pane, PaneGroup, PaneResizer } from 'paneforge';
	import { JazzSvelteProvider } from 'jazz-tools/svelte';
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
	const isChatPage = $derived(page.url.pathname === '/');

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
	<JazzSvelteProvider {AccountSchema} sync={sync.config}>
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

			<PaneResizer
				class="resizer"
				onDraggingChange={(v) => (isDragging = v)}
			>
				<div
					class="resizer-grip"
					class:active={isDragging}
					class:collapsed
				>
					<IconGripVertical />
				</div>
			</PaneResizer>

			<Pane minSize={33}>
				<main class:chat={isChatPage}>
					{@render children()}
				</main>
			</Pane>
		</PaneGroup>
	</JazzSvelteProvider>
</div>

<style>
	.wrapper {
		padding: 10px;
		width: 100dvw;
		height: 100dvh;
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

		&:not(&.chat) {
			padding: 6px 8px;
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
</style>
