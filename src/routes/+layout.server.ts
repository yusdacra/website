import { scopeCookies } from '$lib';
import { get, writable } from 'svelte/store';

export const csr = true;
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';

const visitCount = writable(0);

export async function load({ cookies, url, setHeaders }) {
    setHeaders({ 'Cache-Control': 'no-cache' })
    const scopedCookies = scopeCookies(cookies, '/')
    const visitedTimestamp = parseInt(scopedCookies.get('visitedTimestamp') || "0")
    const currentTime = new Date().getTime()
    const timeSinceVisit = currentTime - visitedTimestamp
    if (visitedTimestamp === 0 || timeSinceVisit > 1000 * 60 * 60) {
        visitCount.set(get(visitCount) + 1)
        scopedCookies.set('visitedTimestamp', currentTime.toString())
    }
    return {
        route: url.pathname,
        visitCount: get(visitCount),
    }
}