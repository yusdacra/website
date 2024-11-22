import { env } from "$env/dynamic/private";
import SGDB from "steamgriddb";
import { get, writable } from "svelte/store";

const STEAM_ID = "76561198106829949"

const steamgriddbClient = writable<SGDB | null>(null);
const cachedLastGame = writable<{game: LastGame | null, since: number}>({game: null, since: 0})
type LastGame = {name: string, link: string, icon: string, pfp: string}
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
        const API_URL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`
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