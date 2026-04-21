import { env } from '$env/dynamic/private';
import sharp from 'sharp';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { get, writable } from 'svelte/store';
import * as Navidrome from './navidrome';

const DID = 'did:plc:dfl62fgb7wtjj3fcbb72naae';
const PDS = 'https://zwsp.xyz';
const LAST_TRACK_FILE = `${env.WEBSITE_DATA_DIR}/last_track.json`;
const COVER_ART_CACHE_DIR = `${env.WEBSITE_DATA_DIR}/cover_art_cache`;

type LastTrack = {
	name: string;
	artist: string;
	album: string;
	image: string | null; // Single image URL
	link: string | null;
	when: number;
	shareUrl?: string;
	shareId?: string;
	status: 'playing' | 'played';
};
const lastTrack = writable<LastTrack | null>(null);

// Ensure cache directory exists
const ensureCacheDir = async () => {
	try {
		await mkdir(COVER_ART_CACHE_DIR, { recursive: true });
	} catch (err) {
		// Directory might already exist, ignore error
	}
};

// Helper to fetch, optimize, and cache an image
const fetchAndCacheImage = async (url: string, id: string): Promise<string | null> => {
	const cacheFile = `${COVER_ART_CACHE_DIR}/${id}.webp`;

	// Check if already cached
	try {
		await stat(cacheFile);
		return `/cover_art/${id}.webp`;
	} catch {
		// Not cached, try to fetch
	}

	try {
		const response = await fetch(url);

		if (!response.ok) {
			return null;
		}

		const imageData = await response.arrayBuffer();

		const sharpImg = sharp(imageData).resize({ width: 92 }).webp({ quality: 80 });
		const optimizedImage = await sharpImg.toBuffer();
		sharpImg.destroy();

		await writeFile(cacheFile, optimizedImage);

		return `/cover_art/${id}.webp`;
	} catch (err) {
		console.log(`Failed to fetch/cache image for ${id}:`, err);
		return null;
	}
};

// Fetch and cache MusicBrainz cover art
const fetchAndCacheCoverArt = async (releaseMbId: string): Promise<string | null> => {
	const mbUrl = `https://coverartarchive.org/release/${releaseMbId}/front-250`;
	return fetchAndCacheImage(mbUrl, releaseMbId);
};

// Fetch and cache YouTube thumbnail
const fetchAndCacheYouTubeThumbnail = async (originUrl: string | null | undefined): Promise<string | null> => {
	if (!originUrl) return null;

	try {
		let videoId: string | null = null;
		if (originUrl.includes('youtube.com') || originUrl.includes('music.youtube.com')) {
			videoId = new URL(originUrl).searchParams.get('v');
		} else if (originUrl.includes('youtu.be')) {
			videoId = originUrl.split('youtu.be/')[1]?.split('?')[0];
		}
		if (videoId) {
			const ytUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
			return fetchAndCacheImage(ytUrl, videoId);
		}
	} catch { }

	return null;
};

// Get cover art with caching
const getCoverArt = async (
	releaseMbId: string | null | undefined,
	originUrl: string | null | undefined
): Promise<string | null> => {
	// Try MusicBrainz first (with caching)
	if (releaseMbId) {
		const mbImage = await fetchAndCacheCoverArt(releaseMbId);
		if (mbImage) return mbImage;
	}

	// Fall back to YouTube thumbnail (with caching)
	return fetchAndCacheYouTubeThumbnail(originUrl);
};

export const getLastTrack = async () => {
	try {
		const data = await readFile(LAST_TRACK_FILE, 'utf8');
		lastTrack.set(JSON.parse(data));
	} catch (why) {
		console.log('could not read last track: ', why);
		lastTrack.set(null);
	}
};

const joinArtists = (artists: any[]) => {
	if (!artists || artists.length === 0) return null;
	const uniqueArtists = [...new Set(artists.map((a) => a.artistName))];
	return uniqueArtists.join(', ');
};

export const updateNowPlayingTrack = async () => {
	await ensureCacheDir();

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
					const metadata = statusData.value;
					track = statusData.value.item;
					if (track.playedTime) when = new Date(track.playedTime).getTime();
					status =
						Date.now() / 1000 >= parseInt(metadata.time) + track.duration ? 'played' : 'playing';
				}
			}
		} catch (err) {
			console.log('could not fetch teal status:', err);
		}

		if (!track) return;

		// Check if track changed to handle share links
		const currentData = get(lastTrack);
		const isNewTrack = !currentData || currentData.name !== track.trackName || currentData.artist !== (joinArtists(track.artists) ?? 'Unknown Artist');
		let shareId = currentData?.shareId;
		let link = track.originUrl ?? (track.recordingMbId ? `https://musicbrainz.org/recording/${track.recordingMbId}` : null);

		let shareUrl = undefined;
		if (isNewTrack) {
			// Try to create new share link (no need to delete old one, they expire)
			try {
				const songId = await Navidrome.findSong(track.trackName, joinArtists(track.artists) ?? '');
				if (songId) {
					const newShareId = await Navidrome.createShareLink(songId, `${track.trackName}`);
					if (newShareId) {
						shareId = newShareId;
						shareUrl = Navidrome.getShareUrl(newShareId);
					} else {
						shareId = undefined;
					}
				} else {
					shareId = undefined;
				}
			} catch (err) {
				console.error('Failed to handle Navidrome share:', err);
				shareId = undefined;
			}
		} else {
			// Keep existing Navidrome link if we have one and track hasn't changed
			if (shareId) {
				shareUrl = Navidrome.getShareUrl(shareId);
			}
		}

		const coverArt = await getCoverArt(track.releaseMbId, track.originUrl);

		const data: LastTrack = {
			name: track.trackName,
			artist: joinArtists(track.artists) ?? 'Unknown Artist',
			album: track.releaseName ?? 'Unknown Album',
			image: coverArt,
			link: link,
			when: when,
			shareUrl: shareUrl,
			shareId: shareId,
			status: status
		};

		lastTrack.set(data);
		await writeFile(LAST_TRACK_FILE, JSON.stringify(data), 'utf8');
	} catch (why) {
		console.log('could not fetch teal fm: ', why);
	}
};

export const getNowPlayingTrack = () => {
	return get(lastTrack);
};
