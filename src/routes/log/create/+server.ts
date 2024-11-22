import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getBskyClient } from '$lib/bluesky.ts';
import { createNote } from '$lib/notes.js';
import { RichText } from '@atproto/api';
import { get } from 'svelte/store';

interface NoteData {
    content: string,
    bskyPosse: boolean,
}

export const POST = async ({ request }) => {
    const token = request.headers.get('authorization')
    if (token !== env.GAZEBOT_TOKEN) {
        return new Response("rizz failed", { status: 403 })
    }
    // get note data
    const noteData: NoteData = await request.json()
    console.log("want to create note with data: ", noteData)
    // create note
    const published = Date.now()
    const noteId = createNote({ content: noteData.content, published })
    // bridge to bsky if want to bridge
    if (noteData.bskyPosse) {
        let client = await getBskyClient()
        const rt = new RichText({
            text: `${noteData.content} (${PUBLIC_BASE_URL}/log?id=${noteId})`,
        })
        await rt.detectFacets(client)
        await client.post({
            text: rt.text,
            facets: rt.facets,
        })
    }
    // send back created note id
    return new Response(JSON.stringify({ noteId }), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        }
    })
};
