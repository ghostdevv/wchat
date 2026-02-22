<script lang="ts">
	import IconMessageCirclePlus from '~icons/lucide/message-circle-plus';
	import { AccountSchema } from '$lib/state/db.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import IconSettings from '~icons/lucide/settings';
	import { resolve } from '$app/paths';

	const account = new AccountCoState(AccountSchema, {
		resolve: { root: { chats: { $each: true } } },
	});

	const chats = $derived(
		account.current.$isLoaded
			? account.current.root.chats
					.toSorted(
						(a, b) => b.$jazz.lastUpdatedAt - a.$jazz.lastUpdatedAt,
					)
					.map((chat) => ({
						id: chat.$jazz.id,
						name: chat.name?.trim() ?? chat.$jazz.id,
					}))
			: [],
	);
</script>

<nav class="sidebar">
	<div class="chats">
		{#each chats as chat (chat.id)}
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
