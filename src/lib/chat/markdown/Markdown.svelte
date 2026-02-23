<script lang="ts">
	import './markdown.css';
	import { render } from './markdown';

	interface Props {
		text: string;
	}

	const { text }: Props = $props();
	let rendered = $state('');

	$effect(() => {
		render(text).then((result) => (rendered = result));
	});
</script>

<div class="markdown">
	{@html rendered}
</div>

<style>
	div {
		display: contents;
	}
</style>
