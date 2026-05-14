<script lang="ts">
	import IconMessageCirclePlus from '~icons/lucide/message-circle-plus';
	import IconSettings from '~icons/lucide/settings';
	import { dbm } from '$lib/state/db.svelte';
	import { resolve } from '$app/paths';

	const db = $derived(await dbm.db());

	const chatList = $derived(
		Object.values(db.chats.current)
			// .toSorted((a, b) => b.$jazz.lastUpdatedAt - a.$jazz.lastUpdatedAt)
			.map((chat) => ({ ...chat, name: chat.name ?? chat.id })),
	);
</script>

<nav class="sidebar">
	<div class="chats">
		{#each chatList as chat (chat.id)}
			<a href={resolve('/chat/[id]', { id: chat.id })} title={chat.name}>
				{chat.name}
			</a>
		{/each}
	</div>

	<hr />

	<a href={resolve('/chat')}>
		<IconMessageCirclePlus />
		New Chat
	</a>

	<a href={resolve('/settings')}>
		<IconSettings />
		Settings
	</a>
</nav>

<style>
	.sidebar {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr repeat(2, auto);

		height: 100%;
		max-height: 100%;
		padding: 8px;

		background-color: var(--background-secondary);
		border-radius: 12px;

		.chats {
			display: flex;
			flex-direction: column;
			gap: 4px;

			height: 100%;
			overflow-y: auto;

			a {
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
				display: block;
			}
		}

		a {
			display: flex;
			align-items: center;
			gap: 8px;

			padding: 8px;
			border-radius: 12px;
			color: var(--text);
			transition: background-color 0.2s ease-in-out;

			&:focus,
			&:hover {
				background-color: var(--background-tertiary);
				text-decoration: none;
			}
		}
	}
</style>
