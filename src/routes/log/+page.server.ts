import { noteExists, readNote, readNotesList } from '$lib/notes'

const notesPerPage: number = 12

export const load = ({ url }) => {
    // get the note id to search for and display the page it is in
    const noteId = url.searchParams.get("id")
    // get the page no if one is provided, otherwise default to 1
    let page = parseInt(url.searchParams.get("page") || "1")
    if (isNaN(page)) { page = 1 }

    // calculate page count
    const notesList = readNotesList()
    const pageCount = Math.ceil(notesList.length / notesPerPage)

    // find what page the note id if supplied is from
    if (noteId !== null && noteExists(noteId)) {
        const noteIndex = notesList.lastIndexOf(noteId)
        if (noteIndex > -1) {
            page = Math.floor(noteIndex / notesPerPage) + 1
        }
    }

    // clamp page between our min and max
    page = Math.min(page, pageCount)
    page = Math.max(page, 1)

    // get the notes from the chosen page
    const notes = new Map(
        notesList.slice((page - 1) * notesPerPage, page * notesPerPage)
            .map(
                (id) => { return [id, readNote(id)] }
            )
    )

    return { notes, highlightedNote: noteId, page }
}
