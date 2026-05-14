<script lang="ts">
	import './markdown.css';
	import { render } from './markdown';

	interface Props {
		text: string;
	}

	const { text }: Props = $props();
</script>

<div class="markdown">
	{@html await render(text)}
</div>

<style>
	div {
		display: contents;
	}
</style>
