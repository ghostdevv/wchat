<script lang="ts">
	import { Compartment, EditorState } from '@codemirror/state';
	import { editorTheme, highlightTheme } from './theme';
	import { markdown } from '@codemirror/lang-markdown';
	import { codeLanguages } from './languages';
	import { onMount } from 'svelte';
	import {
		defaultKeymap,
		history,
		historyKeymap,
		indentWithTab,
	} from '@codemirror/commands';
	import {
		bracketMatching,
		foldKeymap,
		indentOnInput,
		syntaxHighlighting,
	} from '@codemirror/language';
	import {
		highlightSelectionMatches,
		searchKeymap,
	} from '@codemirror/search';
	import {
		keymap,
		EditorView,
		crosshairCursor,
		highlightActiveLineGutter,
		placeholder,
	} from '@codemirror/view';

	interface Props {
		value?: string;
		embedded?: boolean;
		onChange?: (value: string) => unknown;
	}

	let { value = $bindable(''), onChange }: Props = $props();

	let root: HTMLDivElement | null = null;

	const lineWrappingCompartment = new Compartment();

	onMount(() => {
		const editor = new EditorView({
			parent: root!,
			state: EditorState.create({
				doc: value,
				extensions: [
					editorTheme,
					history(),
					indentOnInput(),
					crosshairCursor(),
					bracketMatching(),
					placeholder('Something profound...'),
					markdown({ codeLanguages }),
					highlightActiveLineGutter(),
					highlightSelectionMatches(),
					lineWrappingCompartment.of([]),
					syntaxHighlighting(highlightTheme),
					EditorView.updateListener.of((newValue) => {
						value = newValue.state.doc.toString();
						onChange?.(value);
					}),
					keymap.of([
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						indentWithTab,
					]),
				],
			}),
		});

		return () => {
			editor.destroy();
		};
	});
</script>

<div class="root" bind:this={root}></div>

<style>
	.root {
		width: 100%;
		max-width: 100%;
		height: 100%;
		overflow: auto;
		grid-area: editor;
		position: relative;
	}
</style>
