<script lang="ts">
	import IconMessageCirclePlus from '~icons/lucide/message-circle-plus';
	import { AccountSchema } from '$lib/state/db.svelte';
	import { AccountCoState } from 'jazz-tools/svelte';
	import IconSettings from '~icons/lucide/settings';

	const account = new AccountCoState(AccountSchema, {
		resolve: { root: { chats: { $each: true } } },
	});
</script>

<nav class="sidebar">
	<div class="chats">
		{#if account.current.$isLoaded}
			{#each account.current.root.chats as chat (chat.$jazz.id)}
				<a href="/chat/{chat.$jazz.id}" title={chat.$jazz.id}>
					{chat.$jazz.id}
				</a>
			{/each}
		{/if}
	</div>

	<hr />

	<a href="/chat">
		<IconMessageCirclePlus />
		New Chat
	</a>

	<a href="/settings">
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
