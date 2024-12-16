import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getBskyClient } from '$lib/bluesky.js';
import { createNote, findReplyRoot, genNoteId, readNote, type Note } from '$lib/notes';
import type { Post, PostPayload, PostReference, ReplyRef } from '@skyware/bot';

interface NoteData {
    content: string,
    replyTo?: string,
    embedUri?: string,
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
        replyTo: noteData.replyTo,
    }
    let errors: string[] = []
    let repliedNote: Note | null = null
    if (noteData.replyTo !== undefined) {
        repliedNote = readNote(noteData.replyTo)
    }
    // bridge to bsky if want to bridge
    if (noteData.bskyPosse) {
        const postContent = `${noteData.content} (${PUBLIC_BASE_URL}/log?id=${noteId})`
        try {
            const bot = await getBskyClient()
            let postPayload: PostPayload = {
                text: postContent,
                createdAt: new Date(note.published),
                external: noteData.embedUri,
            }
            let postRef: PostReference
            // find parent and reply posts
            let replyRef: ReplyRef | null = null
            if (noteData.replyTo !== undefined && repliedNote !== null) {
                const getBskyUri = (note: Note) => { return note.outgoingLinks?.find((v) => {return v.name === "bsky"})?.link }
                const parentUri = getBskyUri(repliedNote)
                if (parentUri !== undefined) {
                    const parentPost = await bot.getPost(parentUri)
                    postRef = await parentPost.reply(postPayload)
                } else {
                    throw "a reply was requested but no reply is found"
                }
            } else {
                postRef = await bot.post(postPayload)
            }
            note.outgoingLinks?.push({name: "bsky", link: postRef.uri})
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
