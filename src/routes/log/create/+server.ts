import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { postToBsky } from '$lib/bluesky';
import { createNote, genNoteId, type Note } from '$lib/notes';

interface NoteData {
    content: string,
    bskyPosse: boolean,
}

export const POST = async ({ request }) => {
    const token = request.headers.get('authorization')
    if (token !== env.GAZEBOT_TOKEN) {
        return new Response("rizz failed", { status: 403 })
    }
    // get id
    const noteId = genNoteId()
    // get note data
    const noteData: NoteData = await request.json()
    console.log(`want to create note #${noteId} with data: `, noteData)
    // get a date before we start publishing to other platforms
    let note: Note = {
        content: noteData.content,
        published: Date.now(),
        outgoingLinks: [],
    }
    let errors: string[] = []
    // bridge to bsky if want to bridge
    if (noteData.bskyPosse) {
        const postContent = `${noteData.content} (${PUBLIC_BASE_URL}/log?id=${noteId})`
        try {
            const bskyUrl = await postToBsky(postContent)
            note.outgoingLinks?.push({name: "bsky", link: bskyUrl})
        } catch(why) {
            console.log(`failed to post note #${noteId} to bsky: `, why)
            errors.push(`error while posting to bsky: ${why}`)
        }
    }
    // create note (this should never fail otherwise it would defeat the whole purpose lol)
    createNote(noteId, note)
    // send back created note id and any errors that occurred
    return new Response(JSON.stringify({ noteId, errors }), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        }
    })
};
