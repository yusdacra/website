import type { Cookies } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { get, writable } from 'svelte/store'
import { existsSync, readFileSync } from 'fs'
import { Agent, CredentialSession } from '@atproto/api'
import { xml2json } from 'xml-js'
import SGDB from 'steamgriddb'

export const scopeCookies = (cookies: Cookies, path: string) => {
    return {
        get: (key: string) => {
            return cookies.get(key)
        },
        set: (key: string, value: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.set(key, value, { ...props, path })
        },
        delete: (key: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.delete(key, { ...props, path })
        }
    }
}

export const visitCountFile = `${env.WEBSITE_DATA_DIR}/visitcount`
export const visitCount = writable(parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0'));

export const loginToBsky = async () => {
    const creds = new CredentialSession(new URL("https://bsky.social"))
    await creds.login({ identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return new Agent(creds)
}
export const bskyClient = writable<null | Agent>(null)

const cachedLastTrack = writable<{track: LastTrack | null, since: number}>({track: null, since: 0})
export type LastTrack = {name: string, artist: string, image: string | null, link: string}
export const lastFmGetNowPlaying: () => Promise<LastTrack | null> = async () => {
    var cached = get(cachedLastTrack)
    if (Date.now() - cached.since < 10 * 1000) {
        return cached.track
    }
    try {
        const API_URL = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=yusdacra&api_key=da1911d405b5b37383e200b8f36ee9ec&format=json&limit=1"
        var resp = await (await fetch(API_URL)).json()
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

const steamgriddbClient = writable<SGDB | null>(null);
const cachedLastGame = writable<{game: LastGame | null, since: number}>({game: null, since: 0})
export type LastGame = {name: string, link: string, icon: string, pfp: string}
export const steamGetNowPlaying: () => Promise<LastGame | null> = async () => {
    var griddbClient = get(steamgriddbClient)
    if (griddbClient === null) {
        griddbClient = new SGDB(env.STEAMGRIDDB_API_KEY)
        steamgriddbClient.set(griddbClient)
    }
    var cached = get(cachedLastGame)
    if (Date.now() - cached.since < 10 * 1000) {
        return cached.game
    }
    try {
        const API_URL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=76561198106829949&format=json`
        var profile = (await (await fetch(API_URL)).json()).response.players[0]
        if (!profile.gameid) {
            throw "no game is being played"
        }
        var icons = await griddbClient.getIconsBySteamAppId(profile.gameid, ['official'])
        console.log(icons)
        var game = {
            name: profile.gameextrainfo,
            link: `https://store.steampowered.com/app/${profile.gameid}`,
            icon: icons[0].thumb.toString(),
            pfp: profile.avatarmedium,
        }
        cachedLastGame.set({game, since: Date.now()})
        return game
    } catch(why) {
        console.log("could not fetch steam: ", why)
        cachedLastGame.set({game: null, since: Date.now()})
        return null
    }
}