import { lastFmGetNowPlaying } from "$lib/lastfm"
import { steamGetNowPlaying } from "$lib/steam"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    return {lastTrack, lastGame}
}