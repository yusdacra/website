import { env } from '$env/dynamic/private';
import { get, writable } from 'svelte/store';

const GET_RECENT_TRACKS_ENDPOINT =
	'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=yusdacra&api_key=da1911d405b5b37383e200b8f36ee9ec&format=json&limit=1';
const LAST_TRACK_FILE = `${env.WEBSITE_DATA_DIR}/last_track.json`;

type LastTrack = {
	name: string;
	artist: string;
	image: string | null;
	link: string;
	when: number;
	playing: boolean;
};
const lastTrack = writable<LastTrack | null>(null);

export const lastFmReadLast = async () => {
	try {
		const file = Bun.file(LAST_TRACK_FILE);
		const data = (await file.exists()) ? await file.text() : null;
		lastTrack.set(data ? JSON.parse(data) : null);
	} catch (why) {
		console.log('could not read last fm: ', why);
		lastTrack.set(null);
	}
};

export const lastFmUpdateNowPlaying = async () => {
	try {
		const resp = await (await fetch(GET_RECENT_TRACKS_ENDPOINT)).json();
		const track = resp.recenttracks.track[0] ?? null;
		if (!((track['@attr'] ?? {}).nowplaying ?? null)) {
			throw 'no nowplaying track found';
		}
		const data = {
			name: track.name,
			artist: track.artist['#text'],
			image: track.image[2]['#text'] ?? null,
			link: track.url,
			when: Date.now(),
			playing: true
		};
		lastTrack.set(data);
		await Bun.write(LAST_TRACK_FILE, JSON.stringify(data));
	} catch (why) {
		console.log('could not fetch last fm: ', why);
		lastTrack.update((t) => {
			if (t !== null) {
				t.playing = false;
			}
			return t;
		});
	}
};

export const getNowPlaying = () => {
	return get(lastTrack);
};
