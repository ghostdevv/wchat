<script lang="ts">
	import { Compartment, EditorState } from '@codemirror/state';
	import { editorTheme, highlightTheme } from './theme';
	import { markdown } from '@codemirror/lang-markdown';
	import { codeLanguages } from './languages';
	import { untrack } from 'svelte';
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
		onSubmit?: () => void;
		disabled?: boolean;
	}

	let {
		onChange,
		onSubmit,
		value = $bindable(''),
		disabled = false,
	}: Props = $props();

	const disabledCompartment = new Compartment();

	function editor(root: HTMLDivElement) {
		const editor = new EditorView({
			parent: root!,
			state: EditorState.create({
				doc: untrack(() => value),
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
					EditorView.lineWrapping,
					syntaxHighlighting(highlightTheme),
					disabledCompartment.of(EditorState.readOnly.of(disabled)),
					EditorView.updateListener.of((newValue) => {
						value = newValue.state.doc.toString();
						onChange?.(value);
					}),
					keymap.of([
						{
							key: 'Mod-Enter',
							preventDefault: true,
							run() {
								onSubmit?.();
								return true;
							},
						},
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						indentWithTab,
					]),
				],
			}),
		});

		$effect(() => {
			if (value !== editor.state.doc.toString()) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: value,
					},
				});
			}

			if (disabled !== editor.state.readOnly) {
				editor.dispatch({
					effects: disabledCompartment.reconfigure(
						EditorState.readOnly.of(disabled),
					),
				});
			}
		});

		return () => {
			editor.destroy();
		};
	}
</script>

<div class="root" {@attach editor}></div>

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
