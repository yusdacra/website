import { lastFmGetNowPlaying } from "$lib"
import { steamGetNowPlaying } from "$lib/steam"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    return {lastTrack, lastGame}
}