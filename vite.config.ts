import { sveltekit } from '@sveltejs/kit/vite';
import icons from 'unplugin-icons/vite';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [wasm(), sveltekit(), icons({ compiler: 'svelte' })],
});
