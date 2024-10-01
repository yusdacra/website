import { scopeCookies } from '$lib';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { get, writable } from 'svelte/store';

export const csr = true;
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';

const visitCountFile = 'visitcount'
const visitCount = writable(parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0'));

export async function load({ cookies, url, setHeaders }) {
    setHeaders({ 'Cache-Control': 'no-cache' })
    const scopedCookies = scopeCookies(cookies, '/')
    // parse the last visit timestamp from cookies if it exists
    const visitedTimestamp = parseInt(scopedCookies.get('visitedTimestamp') || "0")
    // get unix timestamp
    const currentTime = new Date().getTime()
    const timeSinceVisit = currentTime - visitedTimestamp
    let currentVisitCount = get(visitCount)
    // check if this is the first time a client is visiting or if an hour has passed since they last visited
    if (visitedTimestamp === 0 || timeSinceVisit > 1000 * 60 * 60 * 24) {
        // increment current and write to the store
        currentVisitCount += 1; visitCount.set(currentVisitCount)
        // update the cookie with the current timestamp
        scopedCookies.set('visitedTimestamp', currentTime.toString())
        // write the visit count to a file so we can load it later again
        writeFileSync(visitCountFile, currentVisitCount.toString())
    }
    return {
        route: url.pathname,
        visitCount: currentVisitCount,
    }
}