import { getUserPosts } from '$lib/bluesky.js';
import { noteFromBskyPost } from '../../components/note.svelte';

export const load = async ({ }) => {
    return _load()
}

export const _load = async () => {
    return {
        feedPosts: (await getUserPosts("did:plc:dfl62fgb7wtjj3fcbb72naae", false, 13)).map(noteFromBskyPost),
    }
}