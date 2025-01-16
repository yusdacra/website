import { existsSync, readFileSync, writeFileSync } from 'fs'
import { nanoid } from 'nanoid'
import { env } from '$env/dynamic/private'

export interface OutgoingLinkData {
    name: string,
    link: string,
}

export interface Note {
    content: string,
    published: number,
    outgoingLinks?: OutgoingLinkData[],
    replyTo?: NoteId,
}
type NoteId = string

export const notesFolder = `${env.WEBSITE_DATA_DIR}/note`
export const notesListFile = `${env.WEBSITE_DATA_DIR}/notes`
export const noteIdLength = 8;

export const getNotePath = (id: NoteId) => { return `${notesFolder}/${id}` }
export const genNoteId = () => {
    let id = nanoid(noteIdLength)
    while (existsSync(getNotePath(id))) {
        id = nanoid(noteIdLength)
    }
    return id
}
export const noteExists = (id: NoteId) => { return existsSync(getNotePath(id)) }
export const readNote = (id: NoteId): Note => {
    return JSON.parse(readFileSync(getNotePath(id)).toString())
}
export const findReplyRoot = (id: NoteId): {rootNote: Note, rootNoteId: NoteId} => {
    let noteId: string | null = id
    let current: {rootNote?: Note, rootNoteId?: NoteId} = {}
    while (noteId !== null) {
        current.rootNote = readNote(noteId)
        current.rootNoteId = noteId
        noteId = current.rootNote.replyTo ?? null
    }
    if (current.rootNote === undefined || current.rootNoteId === undefined) {
        throw "no note with id found"
    }
    return {
        rootNote: current.rootNote,
        rootNoteId: current.rootNoteId,
    }
}
export const writeNote = (id: NoteId, note: Note) => {
    writeFileSync(getNotePath(id), JSON.stringify(note))
    // only append to note list if its not in it yet
    let noteList = readNotesList()
    if (noteList.indexOf(id) === -1) {
        writeNotesList([id].concat(noteList))
    }
}
export const createNote = (id: NoteId, note: Note) => {
    writeNote(id, note)
    return id
}

export const readNotesList = (): NoteId[] => {
    return JSON.parse(readFileSync(notesListFile).toString())
}
export const writeNotesList = (note_ids: NoteId[]) => {
    writeFileSync(notesListFile, JSON.stringify(note_ids))
}