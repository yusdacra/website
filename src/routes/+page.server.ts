import { lastFmGetNowPlaying, steamGetNowPlaying } from "$lib"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    return {lastTrack, lastGame}
}