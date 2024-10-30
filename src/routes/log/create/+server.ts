import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { bskyClient } from '$lib';
import { createNote } from '$lib/notes.js';


export const POST = async ({ request }) => {
    const token = request.headers.get('authorization')
    if (token !== env.GAZEBOT_TOKEN) {
        return new Response("rizz failed", { status: 403 })
    }
    // get note data
    const noteData = await request.json()
    if (noteData.content ?? null === null) {
        return new Response("no rizz :(", { status: 400 })
    }
    // create note
    const published = Date.now()
    const noteId = createNote({ content: noteData.content, published })
    // bridge to bsky if want to bridge
    if (noteData.bskyPosse ?? null !== null) {
        await bskyClient.post({text: `${noteData.content} (${PUBLIC_BASE_URL}/log?id=${noteId})`})
    }
    // send back created note id
    return new Response(JSON.stringify({ noteId }), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        }
    })
};