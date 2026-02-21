<script lang="ts">
	const { children } = $props();
</script>

<div class="chat">
	{@render children()}
</div>

<style>
	.chat {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr max-content;
		height: 100%;
	}
</style>
