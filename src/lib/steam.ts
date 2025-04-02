import { env } from '$env/dynamic/private';
import SGDB from 'steamgriddb';
import { get, writable } from 'svelte/store';

const STEAM_ID = '76561198106829949';
const GET_PLAYER_SUMMARY_ENDPOINT = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`;

type LastGame = {
	name: string;
	link: string;
	icon: string;
	pfp: string;
	when: number;
	playing: boolean;
};

const steamgriddbClient = writable<SGDB | null>(null);
const lastGame = writable<LastGame | null>(null);

export const steamUpdateNowPlaying = async () => {
	let griddbClient = get(steamgriddbClient);
	if (griddbClient === null) {
		griddbClient = new SGDB(env.STEAMGRIDDB_API_KEY);
		steamgriddbClient.set(griddbClient);
	}
	try {
		const profile = (await (await fetch(GET_PLAYER_SUMMARY_ENDPOINT)).json()).response.players[0];
		if (!profile.gameid) {
			throw 'no game is being played';
		}
		const icons = await griddbClient.getIconsBySteamAppId(profile.gameid, ['official', 'custom']);
		//console.log(icons)
		const game: LastGame = {
			name: profile.gameextrainfo,
			link: `https://store.steampowered.com/app/${profile.gameid}`,
			icon: icons[0].thumb.toString(),
			pfp: profile.avatarmedium,
			when: Date.now(),
			playing: true
		};
		lastGame.set(game);
	} catch (why) {
		console.log('could not fetch steam: ', why);
		lastGame.update((t) => {
			if (t !== null) {
				t.playing = false;
			}
			return t;
		});
	}
};

export const getLastGame = () => {
	return get(lastGame);
};
