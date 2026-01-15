import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['../']
		},
		watch: {
			usePolling: true,
			useFsEvents: false,
			interval: 100,
		}
	}
});
