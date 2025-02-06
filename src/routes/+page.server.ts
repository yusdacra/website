import { getLastPosts } from "$lib/bluesky.js"
import { getNowPlaying } from "$lib/lastfm"
import { getLastGame } from "$lib/steam"
import { noteFromBskyPost } from "../components/note.svelte"

export const load = async ({}) => {
    const lastTrack = getNowPlaying()
    const lastGame = getLastGame()
    const lastPosts = getLastPosts()
    const lastNote = lastPosts.length > 0 ? noteFromBskyPost(lastPosts[0]) : null
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