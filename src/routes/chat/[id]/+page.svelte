<script lang="ts">
	import Input from '$lib/chat/input/Input.svelte';
</script>

<div class="chat">
	<div class="content">
		<h1>hi</h1>
	</div>

	<Input />
</div>

<style>
	.chat {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr max-content;
		height: 100%;

		.content {
			padding: 10px 12px;
		}
	}
</style>
