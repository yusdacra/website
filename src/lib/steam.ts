import { env } from "$env/dynamic/private";
import SGDB from "steamgriddb";
import { get, writable } from "svelte/store";

const STEAM_ID = "76561198106829949"
const GET_PLAYER_SUMMARY_ENDPOINT = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`

type LastGame = {
    name: string,
    link: string,
    icon: string,
    pfp: string,
    when: number,
}

const steamgriddbClient = writable<SGDB | null>(null)
const lastGame = writable<LastGame | null>(null)

export const steamUpdateNowPlaying = async () => {
    var griddbClient = get(steamgriddbClient)
    if (griddbClient === null) {
        griddbClient = new SGDB(env.STEAMGRIDDB_API_KEY)
        steamgriddbClient.set(griddbClient)
    }
    try {
        var profile = (await (await fetch(GET_PLAYER_SUMMARY_ENDPOINT)).json()).response.players[0]
        if (!profile.gameid) {
            throw "no game is being played"
        }
        var icons = await griddbClient.getIconsBySteamAppId(profile.gameid, ['official'])
        //console.log(icons)
        var game: LastGame = {
            name: profile.gameextrainfo,
            link: `https://store.steampowered.com/app/${profile.gameid}`,
            icon: icons[0].thumb.toString(),
            pfp: profile.avatarmedium,
            when: Date.now(),
        }
        lastGame.set(game)
    } catch(why) {
        console.log("could not fetch steam: ", why)
    }
}

export const getLastGame = () => { return get(lastGame) }