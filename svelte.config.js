import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-node';

const sha =
	process.env.GIT_HASH || execSync('git rev-parse HEAD').toString().trim();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({}),

		version: {
			name: sha.slice(0, 7),
		},

		paths: {
			base: '/wchat',
		},
	},
};

export default config;
