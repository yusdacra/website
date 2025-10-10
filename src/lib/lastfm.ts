import { env } from '$env/dynamic/private';
import { get, writable } from 'svelte/store';

const GET_RECENT_TRACKS_ENDPOINT = 'https://api.listenbrainz.org/1/user/90008/playing-now';
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

export const getLastTrack = async () => {
	try {
		const data = await Deno.readTextFile(LAST_TRACK_FILE);
		lastTrack.set(JSON.parse(data));
	} catch (why) {
		console.log('could not read last track: ', why);
		lastTrack.set(null);
	}
};

const getTrackCoverArt = (track: any) => {
	// parse origin url to see if it matches youtube.com / music.youtube.com and extract video id
	const originUrl = track.additional_info?.origin_url ?? null;
	if (originUrl && (originUrl.includes('youtube.com') || originUrl.includes('music.youtube.com'))) {
		const videoId = new URL(originUrl).searchParams.get('v');
		if (!videoId) return null;
		return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
	}
	return null;
};

export const updateNowPlayingTrack = async () => {
	try {
		const resp = await (await fetch(GET_RECENT_TRACKS_ENDPOINT)).json();
		const track = resp.payload.listens[0]?.track_metadata;
		if (!track) {
			lastTrack.update((t) => {
				if (t !== null) {
					t.playing = false;
				}
				return t;
			});
			return;
		}
		const data = {
			name: track.track_name,
			artist: track.artist_name,
			image: getTrackCoverArt(track),
			link: track.additional_info?.origin_url ?? null,
			when: Date.now(),
			playing: true
		};
		lastTrack.set(data);
		await Deno.writeTextFile(LAST_TRACK_FILE, JSON.stringify(data));
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

export const getNowPlayingTrack = () => {
	return get(lastTrack);
};
