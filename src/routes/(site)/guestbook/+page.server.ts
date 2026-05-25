import { redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { scopeCookies as _scopeCookies, fancyText } from '$lib';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getGuestbookClient, getReplies, getUserPosts, IDENTIFIER } from '$lib/bluesky.js';
import { getVisitorId } from '$lib/visits';
import { nanoid } from 'nanoid';
import { noteFromBskyPost, type NoteData } from '$components/note.svelte';
import { get, writable } from 'svelte/store';
import type { Post } from '$lib/bluesky.js';
import { useToken as checkApiToken, newToken } from '$lib/apiToken.js';
import type { AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { now } from '@atcute/tid';
import { ok } from '@atcute/client';

export const prerender = false;

const callbackUrl = `${PUBLIC_BASE_URL}/guestbook/`;

const createPostRatelimiter = new RetryAfterRateLimiter({
	IP: [5, 'd'],
	IPUA: [2, 'h']
});

const scopeCookies = (cookies: Cookies) => {
	return _scopeCookies(cookies, '/guestbook');
};

const postTokens = writable<Set<string>>(new Set());
const entries = writable<NoteData[]>([]);

export const _fetchEntries = async () => {
	const newEntries: NoteData[] = [];
	const { posts } = await getUserPosts(await getGuestbookClient(), IDENTIFIER, 14);
	const fetchPostReplies = async (post: Post) => {
		const replies = await getReplies(
			await getGuestbookClient(),
			post.uri,
			'did:plc:dfl62fgb7wtjj3fcbb72naae'
		);
		return { post, replies };
	};
	const postsWithReplies = await Promise.all(posts.map(fetchPostReplies));
	for (const { post, replies } of postsWithReplies) {
		const note = noteFromBskyPost(post);
		note.children = replies.map((reply) => {
			const replyNote = noteFromBskyPost(reply);
			replyNote.purposeAction = 'reply';
			replyNote.outgoingLinks = [{ name: 'bsky-reply', link: reply.uri }];
			return replyNote;
		});
		newEntries.push(note);
	}
	entries.set(newEntries);
	return newEntries;
};

export const actions = {
	post: async (event: RequestEvent) => {
		const { request, cookies } = event;
		const scopedCookies = scopeCookies(cookies);
		const rateStatus = await createPostRatelimiter.check(event);
		if (rateStatus.limited) {
			scopedCookies.set(
				'sendError',
				`you are being ratelimited sowwy :c, try again after ${rateStatus.retryAfter} seconds`
			);
			redirect(303, callbackUrl);
		}
		const form = await request.formData();
		const apiToken = form.get('_token')?.toString() ?? '';
		if (!checkApiToken(apiToken)) {
			scopedCookies.set('sendError', 'api token is invalid');
			redirect(303, callbackUrl);
		}
		const content = form.get('content')?.toString().substring(0, 300);
		if (content === undefined) {
			scopedCookies.set('sendError', 'content field is missing');
			redirect(303, callbackUrl);
		}
		// save form content in a cookie
		scopedCookies.set('postData', content);
		// create a token we will use to validate
		const token = nanoid();
		postTokens.update((set) => set.add(token));
		scopedCookies.set('postAuth', token);
		redirect(303, callbackUrl);
	}
};

export async function load({ cookies }) {
	const scopedCookies = scopeCookies(cookies);
	const data = {
		entries: get(entries),
		sendError: scopedCookies.get('sendError') || '',
		getError: '',
		sendRatelimited: scopedCookies.get('sendRatelimited') || '',
		getRatelimited: false,
		fillText: fancyText(getVisitorId(cookies) ?? nanoid()),
		apiToken: newToken()
	};
	const rawPostData = scopedCookies.get('postData') || null;
	const postAuth = scopedCookies.get('postAuth') || null;
	if (rawPostData !== null && postAuth !== null) {
		// delete the postData cookie after we got it cause we dont need it anymore
		scopedCookies.delete('postData');
		scopedCookies.delete('postAuth');
		// get and validate token
		if (!get(postTokens).has(postAuth)) {
			scopedCookies.set(
				'sendError',
				'invalid post token! this is either a bug or you should stop doing silly stuff'
			);
			redirect(303, callbackUrl);
		}
		postTokens.update((set) => {
			set.delete(postAuth);
			return set;
		});
		// post entry
		try {
			// return error if content was not set or if empty
			const content = rawPostData.substring(0, 300).trim();
			if (content.length === 0) {
				scopedCookies.set('sendError', `content field was empty`);
				redirect(303, callbackUrl);
			}
			// post to guestbook account
			const client = await getGuestbookClient();
			const post: AppBskyFeedPost.Main = {
				$type: 'app.bsky.feed.post',
				createdAt: new Date().toISOString(),
				text: content
			};
			const postRkey = now();
			const threadgate: AppBskyFeedThreadgate.Main = {
				$type: 'app.bsky.feed.threadgate',
				createdAt: new Date().toISOString(),
				post: `at://${IDENTIFIER}/${post.$type}/${postRkey}`,
				allow: [{ $type: 'app.bsky.feed.threadgate#followingRule' }]
			};
			// use applyWrites to make a post record and a threadgate record
			await ok(
				client.post('com.atproto.repo.applyWrites', {
					input: {
						repo: IDENTIFIER,
						writes: [
							{
								$type: 'com.atproto.repo.applyWrites#create',
								collection: post.$type,
								value: post,
								rkey: postRkey
							},
							{
								$type: 'com.atproto.repo.applyWrites#create',
								collection: 'app.bsky.feed.threadgate',
								value: threadgate
							}
						]
					}
				})
			);
			try {
				data.entries = await _fetchEntries();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				data.getError = err.toString();
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			scopedCookies.set('sendError', err.toString());
			redirect(303, callbackUrl);
		}
		redirect(303, callbackUrl);
	}
	// delete the cookies after we get em since we dont really need these more than once
	scopedCookies.delete('sendError');
	scopedCookies.delete('sendRatelimited');

	return data;
}
