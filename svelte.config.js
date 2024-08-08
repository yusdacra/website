import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { mdsvex } from 'mdsvex'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx'],
			rehypePlugins: [
				rehypeSlug,
				rehypeAutolinkHeadings,
			],
			smartypants: { dashes: 'oldschool' },
			layout: './src/routes/+layout.svelte',
		}),
	],

	kit: {
		adapter: adapter({
			precompress: true,
		}),
	}
};

export default config;
