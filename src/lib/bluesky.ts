import { env } from '$env/dynamic/private';
import { AppBskyFeedPost } from '@atcute/bluesky';

import { Client, CredentialManager, ok, simpleFetchHandler } from '@atcute/client';
import { parse, type CanonicalResourceUri, type Did } from '@atcute/lexicons';
import { get, writable } from 'svelte/store';

export const PDS_URL = 'https://gaze.systems';
export const IDENTIFIER = 'did:web:guestbook.gaze.systems';

const constellationClient = new Client({
	handler: simpleFetchHandler({ service: 'https://constellation.microcosm.blue' })
});
const userClient = new Client({
	handler: simpleFetchHandler({ service: 'https://zwsp.xyz' })
});
const guestbookClient = writable<null | Client>(null);

export type Post = {
	record: AppBskyFeedPost.Main;
	uri: CanonicalResourceUri;
};

export const getGuestbookClient = async () => {
	try {
		let client = get(guestbookClient);
		if (client === null) {
			client = await loginToBsky();
			guestbookClient.set(client);
		}
		return client;
	} catch (e) {
		throw `cant login to bsky: ${e}`;
	}
};

const loginToBsky = async () => {
	const password = env.BSKY_PASSWORD ?? null;
	if (password === null) {
		throw new Error('no password provided');
	}
	const handler = new CredentialManager({ service: PDS_URL });
	const rpc = new Client({ handler });
	await handler.login({ identifier: IDENTIFIER, password });
	return rpc;
};

export const getUserPosts = async (
	client: Client,
	repo: Did,
	count: number = 10,
	cursor?: string
) => {
	const posts: Post[] = [];
	// fetch requested amount of posts
	while (posts.length < count - 1) {
		const fetched = ok(
			await client.get('com.atproto.repo.listRecords', {
				params: { repo, collection: 'app.bsky.feed.post', cursor, limit: count }
			})
		);
		for (const record of fetched.records) {
			const post = parse(AppBskyFeedPost.mainSchema, record.value);
			if (post.reply) continue;
			posts.push({
				record: post,
				uri: record.uri as CanonicalResourceUri
			});
		}
		cursor = fetched.cursor;
		if (cursor === undefined) {
			break;
		}
	}
	return { posts: posts.slice(0, count), cursor };
};

const lastPosts = writable<Post[]>([]);

export const updateLastPosts = async () => {
	try {
		const { posts } = await getUserPosts(userClient, 'did:plc:dfl62fgb7wtjj3fcbb72naae', 10);
		lastPosts.set(posts);
	} catch (err) {
		console.log(`can't update last posts ${err}`);
	}
};

export const getLastPosts = () => {
	return get(lastPosts);
};

export const getReplies = async (client: Client, postUri: CanonicalResourceUri, forDid?: Did) => {
	// todo: do cursor stuff here later if it matters
	const backlinks = ok(
		await constellationClient.get('blue.microcosm.links.getBacklinks', {
			params: {
				did: forDid ? [forDid] : [],
				subject: postUri,
				source: 'app.bsky.feed.post:reply.parent.uri'
			}
		})
	);
	const replies: Post[] = [];
	for (const record of backlinks.records) {
		const fetched = ok(
			await client.get('com.atproto.repo.getRecord', {
				params: { repo: record.did, collection: record.collection, rkey: record.rkey }
			})
		);
		const post = parse(AppBskyFeedPost.mainSchema, fetched.value);
		replies.push({ record: post, uri: fetched.uri as CanonicalResourceUri });
	}
	return replies;
};
