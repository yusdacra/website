import { env } from '$env/dynamic/private';
import { get, writable } from 'svelte/store';

const DID = 'did:plc:dfl62fgb7wtjj3fcbb72naae';
const PDS = 'https://zwsp.xyz';
const LAST_TRACK_FILE = `${env.WEBSITE_DATA_DIR}/last_track.json`;

type LastTrack = {
	name: string;
	artist: string;
	album: string;
	image: string | null;
	link: string | null;
	when: number;
	status: 'playing' | 'played';
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

const getTrackCoverArt = (releaseMbId: string | null | undefined, originUrl: string | null | undefined) => {
	if (releaseMbId) return `https://coverartarchive.org/release/${releaseMbId}/front-250`;
	
	if (!originUrl) return null;
	let videoId: string | null = null;
	
	try {
		if (originUrl.includes('youtube.com') || originUrl.includes('music.youtube.com')) {
			videoId = new URL(originUrl).searchParams.get('v');
		} else if (originUrl.includes('youtu.be')) {
			videoId = originUrl.split('youtu.be/')[1]?.split('?')[0];
		}
	} catch {
		return null;
	}

	if (!videoId) return null;
	return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

const joinArtists = (artists: any[]) => {
	if (!artists || artists.length === 0) return null;
	return artists.map((a) => a.artistName).join(', ');
};

export const updateNowPlayingTrack = async () => {
	try {
		let track: any = null;
		let when: number = Date.now();
		let status: 'playing' | 'played' = 'played';

		try {
			const statusRes = await fetch(
				`${PDS}/xrpc/com.atproto.repo.getRecord?repo=${DID}&collection=fm.teal.alpha.actor.status&rkey=self`
			);
			if (statusRes.ok) {
				const statusData = await statusRes.json();
				if (statusData.value?.item) {
					track = statusData.value.item;
					if (track.playedTime) when = new Date(track.playedTime).getTime();
					status = 'playing';
				}
			}
		} catch (err) {
			console.log('could not fetch teal status:', err);
		}

		if (!track) {
			try {
				const playRes = await fetch(
					`${PDS}/xrpc/com.atproto.repo.listRecords?repo=${DID}&collection=fm.teal.alpha.feed.play&limit=1`
				);
				if (playRes.ok) {
					const playData = await playRes.json();
					if (playData.records.length > 0) {
						track = playData.records[0].value;
						if (track.playedTime) when = new Date(track.playedTime).getTime();
						status = 'played';
					}
				}
			} catch (err) {
				console.log('could not fetch teal history:', err);
			}
		}

		if (!track) return;

		const data: LastTrack = {
			name: track.trackName,
			artist: joinArtists(track.artists) ?? 'Unknown Artist',
			album: track.releaseName ?? 'Unknown Album',
			image: getTrackCoverArt(track.releaseMbId, track.originUrl),
			link: track.originUrl ?? null,
			when: when,
			status: status
		};

		lastTrack.set(data);
		await Deno.writeTextFile(LAST_TRACK_FILE, JSON.stringify(data));
	} catch (why) {
		console.log('could not fetch teal fm: ', why);
	}
};

export const getNowPlayingTrack = () => {
	return get(lastTrack);
};
