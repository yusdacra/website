import { getLastPosts } from '$lib/bluesky.js';
import { noteFromBskyPost } from '../../components/note.svelte';

export const load = async () => {
	return _load();
};

export const _load = async () => {
	return {
		feedPosts: getLastPosts().map(noteFromBskyPost)
	};
};
