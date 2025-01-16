import { lastFmGetNowPlaying } from "$lib/lastfm"
import { readNote, readNotesList } from "$lib/notes.js"
import { steamGetNowPlaying } from "$lib/steam"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    let banners: number[] = []
    while (banners.length < 3) {
        const no = getBannerNo(banners)
        banners.push(no)
    }
    const lastNoteId = readNotesList()[0]
    const lastNote = readNote(lastNoteId)
    return {banners, lastTrack, lastGame, lastNote, lastNoteId}
}

const getBannerNo = (others: number[]) => {
    const no = Math.floor(Math.random() * 20) + 1
    if (others.includes(no)) {
        return ((no + (Math.floor(Math.random() * 20))) % 20) + 1
    }
    return no
};