import { env } from '$env/dynamic/private';
import { Bot, type Post } from '@skyware/bot';
import { get, writable } from 'svelte/store';

const bskyClient = writable<null | Bot>(null);

export const getBskyClient = async () => {
	let client = get(bskyClient);
	if (client === null) {
		client = await loginToBsky();
		bskyClient.set(client);
	}
	return client;
};

const loginToBsky = async () => {
	const password = env.BSKY_PASSWORD ?? null;
	if (password === null) {
		throw new Error('no password provided');
	}
	const bot = new Bot({ service: 'https://gaze.systems' });
	await bot.login({ identifier: 'guestbook.gaze.systems', password });
	return bot;
};

export const getUserPosts = async (
	did: string,
	count: number = 10,
	cursor: string | null = null
) => {
	const client = await getBskyClient();
	let feedCursor: string | null | undefined = cursor;
	const posts: Post[] = [];
	// fetch requested amount of posts
	while (posts.length < count - 1 && (typeof feedCursor === 'string' || feedCursor === null)) {
		const feedData = await client.getUserPosts(did, {
			limit: count,
			filter: 'posts_no_replies',
			cursor: feedCursor === null ? undefined : feedCursor
		});
		posts.push(...feedData.posts.filter((post) => post.author.did === did));
		feedCursor = feedData.cursor;
	}
	return { posts, cursor: feedCursor === null ? undefined : feedCursor };
};

const lastPosts = writable<Post[]>([]);

export const updateLastPosts = async () => {
	try {
		const { posts } = await getUserPosts('did:plc:dfl62fgb7wtjj3fcbb72naae', 13);
		lastPosts.set(posts);
	} catch (err) {
		console.log(`can't update last posts ${err}`);
	}
};

export const getLastPosts = () => {
	return get(lastPosts);
};
