import { env } from '$env/dynamic/private';
import { scopeCookies, visitCount, visitCountFile } from '$lib';
import { writeFileSync } from 'fs';
import { get } from 'svelte/store';

export const csr = true;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always';

export async function load({ request, cookies, url, setHeaders, fetch }) {
    fetch('https://api.darkvisitors.com/visits', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${env.DARK_VISITORS_TOKEN}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            request_path: url.pathname,
            request_method: request.method,
            request_headers: request.headers,
        })
    }).catch((why) => {
        console.log("failed sending dark visitors analytics:", why)
        return null
    }).then(async (resp) => {
        if (resp !== null) {
            const msg = await resp.json()
            const host = `(${request.headers.get('host')} ${request.headers.get('x-real-ip')})`
            console.log(`sent visitor analytic to dark visitors: ${resp.statusText}; ${msg.message ?? ''}${host}`)
        }
    })

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

    setHeaders({ 'Cache-Control': 'no-cache' })

    return {
        route: url.pathname,
        visitCount: currentVisitCount,
    }
}
