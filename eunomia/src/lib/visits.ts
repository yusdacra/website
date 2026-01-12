import { scopeCookies } from '$lib/index.ts';
import type { Cookies } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { darkVisitors } from './darkvisitors.ts';

export type Visitor = { visits: number[] };
export const lastVisitors = writable<Map<string, Visitor>>(new Map());
const VISITOR_EXPIRY_SECONDS = 60 * 60; // an hour seems reasonable

export const removeLastVisitor = (id: string) => {
	const visitors = get(lastVisitors);
	if (visitors.has(id)) {
		const visitor = visitors.get(id) ?? { visits: [] };
		visitor?.visits.shift();
		// if not enough visits remove
		if (visitor?.visits.length === 0) {
			visitors.delete(id);
		} else {
			visitors.set(id, visitor);
		}
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
	const headers = Object.fromEntries(request.headers.entries());
	try {
		darkVisitors.trackVisit({
			path: url.pathname,
			method: request.method,
			headers: headers
		});
	} catch (error) {
		console.error('failed to notify dark visitors:', error);
	}
};
