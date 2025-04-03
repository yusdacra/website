import { getLastPosts } from '$lib/bluesky.js';
import { getNowPlaying } from '$lib/lastfm';
import { getLastGame } from '$lib/steam';
import { noteFromBskyPost } from '../components/note.svelte';
import { env } from '$env/dynamic/private';

export const load = async () => {
	const lastTrack = getNowPlaying();
	const lastGame = getLastGame();
	const lastPosts = getLastPosts();
	const lastNote = lastPosts.length > 0 ? noteFromBskyPost(lastPosts[0]) : null;
	let banners: number[] = [];
	while (banners.length < 3) {
		const no = getBannerNo(banners);
		banners.push(no);
	}
	return { banners, lastTrack, lastGame, lastNote };
};

export const actions = {
	pushnotif: async ({ request }: RequestEvent) => {
		const form = await request.formData();
		const content = encodeURIComponent(form.get('content')?.toString().substring(0, 100));
		try {
			fetch(
				`https://api.day.app/${env.BARK_DEVICE_ID}/gaze.systems/${content}?icon=https://gaze.systems/icons/gaze_site.webp`
			);
		} catch (err) {
			console.log(`failed to push notification: ${err}`);
		}
	}
};

const getBannerNo = (others: number[]) => {
	const no = Math.floor(Math.random() * 20) + 1;
	if (others.includes(no)) {
		return ((no + Math.floor(Math.random() * 20)) % 20) + 1;
	}
	return no;
};
