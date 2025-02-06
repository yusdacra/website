import { getUserPosts } from "$lib/bluesky.js"
import { lastFmGetNowPlaying } from "$lib/lastfm"
import { steamGetNowPlaying } from "$lib/steam"
import { noteFromBskyPost } from "../components/note.svelte"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    const lastNote = noteFromBskyPost((await getUserPosts("did:plc:dfl62fgb7wtjj3fcbb72naae", false, 1))[0])
    let banners: number[] = []
    while (banners.length < 3) {
        const no = getBannerNo(banners)
        banners.push(no)
    }
    return {banners, lastTrack, lastGame, lastNote}
}

const getBannerNo = (others: number[]) => {
    const no = Math.floor(Math.random() * 20) + 1
    if (others.includes(no)) {
        return ((no + (Math.floor(Math.random() * 20))) % 20) + 1
    }
    return no
};