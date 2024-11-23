import { env } from "$env/dynamic/private";
import { scopeCookies } from "$lib";
import type { Cookies } from "@sveltejs/kit";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { get, writable } from "svelte/store";

const visitCountFile = `${env.WEBSITE_DATA_DIR}/visitcount`
const visitCount = writable(parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0'));

type Visitor = { since: number }
const lastVisitors = writable<Visitor[]>([]);
const MAX_VISITORS = 10
const VISITOR_EXPIRY_SECONDS = 60 * 30 // half an hour is reasonable

export const incrementVisitCount = (request: Request, cookies: Cookies) => {
    let currentVisitCount = get(visitCount)
    // check whether the request is from a bot or not (this doesnt need to be accurate we just want to filter out honest bots)
    if (isBot(request)) { return currentVisitCount }
    const scopedCookies = scopeCookies(cookies, '/')
    // parse the last visit timestamp from cookies if it exists
    const visitedTimestamp = parseInt(scopedCookies.get('visitedTimestamp') || "0")
    // get unix timestamp
    const currentTime = Date.now()
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
    return currentVisitCount
}

export const addLastVisitor = (request: Request, cookies: Cookies) => {
    const currentTime = Date.now()
    let visitors = get(lastVisitors).filter(
        (value) => { return currentTime - value.since > 1000 * VISITOR_EXPIRY_SECONDS }
    )
    // check whether the request is from a bot or not (this doesnt need to be accurate we just want to filter out honest bots)
    if (isBot(request)) { return visitors }
    const scopedCookies = scopeCookies(cookies, '/')
    // parse the last visit timestamp from cookies if it exists
    const visitorTimestamp = parseInt(scopedCookies.get('visitorTimestamp') || "0")
    // get unix timestamp
    const timeSinceVisit = currentTime - visitorTimestamp
    // check if this is the first time a client is visiting or if an hour has passed since they last visited
    if (visitorTimestamp === 0 || timeSinceVisit > 1000 * VISITOR_EXPIRY_SECONDS) {
        visitors.push({ since: currentTime })
        if (visitors.length > MAX_VISITORS) { visitors.shift() }
        // update the cookie with the current timestamp
        scopedCookies.set('visitorTimestamp', currentTime.toString())
    }
    return visitors
}

const isBot = (request: Request) => {
    const ua = request.headers.get('user-agent')
    return ua ? ua.toLowerCase().match(/(bot|crawl|spider|walk|fetch|scrap|proxy|image)/) !== null : true

}

export const notifyDarkVisitors = (url: URL, request: Request) => {
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
}