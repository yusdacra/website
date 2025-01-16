import { lastFmGetNowPlaying } from "$lib/lastfm"
import { steamGetNowPlaying } from "$lib/steam"

export const load = async ({}) => {
    const lastTrack = await lastFmGetNowPlaying()
    const lastGame = await steamGetNowPlaying()
    let banners: number[] = []
    while (banners.length < 3) {
        const no = getBannerNo(banners)
        banners.push(no)
    }
    return {banners, lastTrack, lastGame}
}

const getBannerNo = (others: number[]) => {
    const no = Math.floor(Math.random() * 20) + 1
    if (others.includes(no)) {
        return ((no + (Math.floor(Math.random() * 20))) % 20) + 1
    }
    return no
};