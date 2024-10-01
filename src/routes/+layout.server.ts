import { scopeCookies, visitCount, visitCountFile } from '$lib';
import { writeFileSync } from 'fs';
import { get } from 'svelte/store';

export const csr = true;
export const ssr = true;
export const prerender = 'auto';
export const trailingSlash = 'always';

export async function load({ request, cookies, url, setHeaders }) {
  setHeaders({ 'Cache-Control': 'no-cache' })
  let currentVisitCount = get(visitCount)
  // check whether the request is from a bot or not (this doesnt need to be accurate we just want to filter out honest bots)
  const ua = request.headers.get('user-agent')
  const isBot = ua ? ua.toLowerCase().match(/(bot|crawl|spider|walk)/) !== null : true
  if (!isBot) {
    const scopedCookies = scopeCookies(cookies, '/')
    // parse the last visit timestamp from cookies if it exists
    const visitedTimestamp = parseInt(scopedCookies.get('visitedTimestamp') || "0")
    // get unix timestamp
    const currentTime = new Date().getTime()
    const timeSinceVisit = currentTime - visitedTimestamp
    // check if this is the first time a client is visiting or if an hour has passed since they last visited
    if (visitedTimestamp === 0 || timeSinceVisit > 1000 * 60 * 60 * 24) {
      // increment current and write to the store
      currentVisitCount += 1; visitCount.set(currentVisitCount)
      // update the cookie with the current timestamp
      scopedCookies.set('visitedTimestamp', currentTime.toString())
      // write the visit count to a file so we can load it later again
      writeFileSync(visitCountFile, currentVisitCount.toString())
    }
  }
  return {
    route: url.pathname,
    visitCount: currentVisitCount,
  }
}
