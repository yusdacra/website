import { env } from '$env/dynamic/private';
import { scopeCookies } from '$lib';
import type { Cookies } from '@sveltejs/kit';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';

const visitCountFile = `${env.WEBSITE_DATA_DIR}/visitcount`;
export const visitCount = writable(
	parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0')
);

type Visitor = { visits: number[] };
export const lastVisitors = writable<Map<string, Visitor>>(new Map());
const VISITOR_EXPIRY_SECONDS = 60 * 60; // an hour seems reasonable

export const decrementVisitCount = () => {
	visitCount.set(get(visitCount) - 1);
};

export const incrementVisitCount = (request: Request, cookies: Cookies) => {
	let currentVisitCount = get(visitCount);
	// check whether the request is from a bot or not (this doesnt need to be accurate we just want to filter out honest bots)
	if (isBot(request)) return false;
	const scopedCookies = scopeCookies(cookies, '/');
	// parse the last visit timestamp from cookies if it exists
	const visitedTimestamp = parseInt(scopedCookies.get('visitedTimestamp') || '0');
	// get unix timestamp
	const currentTime = Date.now();
	const timeSinceVisit = currentTime - visitedTimestamp;
	// check if this is the first time a client is visiting or if an hour has passed since they last visited
	if (visitedTimestamp === 0 || timeSinceVisit > 1000 * 60 * 60 * 24) {
		// increment current and write to the store
		currentVisitCount += 1;
		visitCount.set(currentVisitCount);
		// update the cookie with the current timestamp
		scopedCookies.set('visitedTimestamp', currentTime.toString());
		// write the visit count to a file so we can load it later again
		writeFileSync(visitCountFile, currentVisitCount.toString());
	}
	return true;
};

export const removeLastVisitor = (id: string) => {
	const visitors = get(lastVisitors);
	if (visitors.has(id)) {
		const visitor = visitors.get(id) ?? { visits: [] };
		visitor?.visits.pop();
		visitors.set(id, visitor);
	}
	lastVisitors.set(visitors);
};

export const addLastVisitor = (request: Request, cookies: Cookies) => {
	const { visitors, visitorId } = _addLastVisitor(get(lastVisitors), request, cookies);
	lastVisitors.set(visitors);
	return visitorId;
};

export const getVisitorId = (cookies: Cookies) => {
	const scopedCookies = scopeCookies(cookies, '/');
	// parse the last visit timestamp from cookies if it exists
	return scopedCookies.get('visitorId');
};

// why not use this for incrementVisitCount? cuz i wanna have separate visit counts (one per hour and one per day, per hour being recent visitors)
const _addLastVisitor = (visitors: Map<string, Visitor>, request: Request, cookies: Cookies) => {
	const currentTime = Date.now();
	// filter out old entries
	visitors.forEach((visitor, id, map) => {
		if (currentTime - visitor.visits[0] > 1000 * VISITOR_EXPIRY_SECONDS) map.delete(id);
		else {
			visitor.visits = visitor.visits.filter((since) => {
				return currentTime - since < 1000 * VISITOR_EXPIRY_SECONDS;
			});
			map.set(id, visitor);
		}
	});
	// check whether the request is from a bot or not (this doesnt need to be accurate we just want to filter out honest bots)
	if (isBot(request)) return { visitors, visitorId: null };
	const scopedCookies = scopeCookies(cookies, '/');
	// parse the last visit timestamp from cookies if it exists
	let visitorId = scopedCookies.get('visitorId') || '';
	// if no such id exists, create one and assign it to the client
	if (!visitors.has(visitorId)) {
		visitorId = nanoid();
		scopedCookies.set('visitorId', visitorId);
		console.log(`new client visitor id ${visitorId}`);
	}
	// update the entry
	const visitorEntry = visitors.get(visitorId) || { visits: [] };
	// put new visit in the front
	visitorEntry.visits = [currentTime].concat(visitorEntry.visits);
	visitors.set(visitorId, visitorEntry);
	return {
		visitors,
		visitorId
	};
};

export const isBot = (request: Request) => {
	const ua = request.headers.get('user-agent');
	return ua
		? ua.toLowerCase().match(/(bot|crawl|spider|walk|fetch|scrap|proxy|image)/) !== null
		: true;
};

export const notifyDarkVisitors = (url: URL, request: Request) => {
	fetch('https://api.darkvisitors.com/visits', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.DARK_VISITORS_TOKEN}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			request_path: url.pathname,
			request_method: request.method,
			request_headers: request.headers
		})
	})
		.catch((why) => {
			console.log('failed sending dark visitors analytics:', why);
			return null;
		})
		.then(async (resp) => {
			if (resp !== null) {
				const msg = await resp.json();
				const host = `(${request.headers.get('host')}|${request.headers.get('x-real-ip')}|${request.headers.get('user-agent')})`;
				console.log(
					`sent visitor analytic to dark visitors: ${resp.statusText}; ${msg.message ?? ''}${host}`
				);
			}
		});
};
