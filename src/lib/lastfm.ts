import { get, writable } from "svelte/store"

const GET_RECENT_TRACKS_ENDPOINT = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=yusdacra&api_key=da1911d405b5b37383e200b8f36ee9ec&format=json&limit=1"
const CACHE_EXPIRY_SECONDS = 10

type LastTrack = {name: string, artist: string, image: string | null, link: string}
type CachedLastTrack = {track: LastTrack | null, since: number}
const cachedLastTrack = writable<CachedLastTrack>({track: null, since: 0})

export const lastFmGetNowPlaying: () => Promise<LastTrack | null> = async () => {
    var cached = get(cachedLastTrack)
    if (Date.now() - cached.since < CACHE_EXPIRY_SECONDS * 1000) {
        return cached.track
    }
    try {
        var resp = await (await fetch(GET_RECENT_TRACKS_ENDPOINT)).json()
        var track = resp.recenttracks.track[0] ?? null
        if (!(track['@attr'].nowplaying ?? null)) {
            throw "no nowplaying track found"
        }
        var data = {
            name: track.name,
            artist: track.artist['#text'],
            image: track.image[2]['#text'] ?? null,
            link: track.url,
        }
        cachedLastTrack.set({track: data, since: Date.now()})
        return data
    } catch(why) {
        console.log("could not fetch last fm: ", why)
        cachedLastTrack.set({track: null, since: Date.now()})
        return null
    }
}