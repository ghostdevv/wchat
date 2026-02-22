import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

export const codeLanguages = [
	...languages,
	LanguageDescription.of({
		name: 'Svelte',
		extensions: ['svelte'],
		async load() {
			const { svelte } = await import('@replit/codemirror-lang-svelte');
			return svelte();
		},
	}),
];
