import { lastFmGetNowPlaying } from "$lib/lastfm"
import { steamGetNowPlaying } from "$lib/steam"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    const banners = [getBannerNo(), getBannerNo(), getBannerNo()]
    return {banners, lastTrack, lastGame}
}

const getBannerNo = () => {
    return Math.floor(Math.random() * 18) + 1;
};