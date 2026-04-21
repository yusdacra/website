import { getLastPosts } from '$lib/bluesky.js';
import { getNowPlayingTrack } from '$lib/lastfm';
import { getLastGame } from '$lib/steam';
import { noteFromBskyPost } from '$components/note.svelte';
import { pushNotification } from '$lib/pushnotif';
import { getLastActivity } from '$lib/activity.js';
import type { RequestEvent } from '@sveltejs/kit';
import { useToken as checkApiToken } from '$lib/apiToken.js';

export const load = async () => {
	const lastTrack = getNowPlayingTrack();
	const lastGame = getLastGame();
	const lastPosts = getLastPosts();
	const lastNote = lastPosts.length > 0 ? noteFromBskyPost(lastPosts[0]) : null;
	const lastActivity = getLastActivity();
	const banners: number[] = [];
	while (banners.length < 3) {
		const no = getBannerNo(banners);
		banners.push(no);
	}
	return { banners, lastTrack, lastGame, lastNote, lastActivity };
};

export const actions = {
	default: async ({ request }: RequestEvent) => {
		const form = await request.formData();
		const token = form.get('_token')?.toString() ?? '';
		if (!checkApiToken(token)) return;
		const content = form.get('content')?.toString().substring(0, 100);
		if (content === undefined) return;
		pushNotification(content);
	}
};

const getBannerNo = (others: number[]) => {
	const no = Math.floor(Math.random() * 20) + 1;
	if (others.includes(no)) {
		return ((no + Math.floor(Math.random() * 20)) % 20) + 1;
	}
	return no;
};
