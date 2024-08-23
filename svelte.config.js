import adapter from 'svelte-adapter-bun';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { mdsvex } from 'mdsvex'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'

import * as toml from "@std/toml";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx'],
			frontmatter: {
				type: "toml",
				marker: "+",
				parse(frontmatter, messages) {
					try {
						return toml.parse(frontmatter);
					} catch (e) {
						messages.push(
							"Parsing error on line " +
								e.line +
								", column " +
								e.column +
								": " +
								e.message
						);
					}
				},
			},
			rehypePlugins: [
				rehypeSlug,
				rehypeAutolinkHeadings,
			],
			smartypants: {
				dashes: 'oldschool',
				quotes: true,
				ellipses: true,
				backticks: false,
			},
			layout: {
				blogpost: './src/routes/entries/_layout.svelte',
			},
		}),
	],

	kit: {
		csrf: {
			checkOrigin: false,
		},
		prerender: {
			handleHttpError: 'warn',
		},
		adapter: adapter({
			precompress: true,
		}),
	}
};

export default config;
