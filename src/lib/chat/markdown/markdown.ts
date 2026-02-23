import { serendipity } from './serendipity-shiki';
import markedShiki from 'marked-shiki';
import markedAlert from 'marked-alert';
import { codeToHtml } from 'shiki';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.use(markedAlert());

marked.use(
	markedShiki({
		async highlight(code, lang) {
			return await codeToHtml(code, { lang, theme: serendipity });
		},
	}),
);

export async function render(text: string) {
	const md = await marked(text, { async: true, gfm: true });
	return DOMPurify.sanitize(md);
}
