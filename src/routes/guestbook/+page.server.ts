import { GUESTBOOK_URL } from '$env/static/private'
import { redirect } from '@sveltejs/kit';
import {spawnSync} from 'node:child_process'

interface Entry {
    author: String,
    content: String,
    timestamp: number,
}

interface FetchResult {
    location: string,
    status: number,
    body: any,
}

function fetchBlocking(url: string): FetchResult | string {
    const spawnResult = spawnSync("bun", ["src/lib/fetchHack.mjs", url]);
    const out = spawnResult.stdout.toString();
    try {
        return JSON.parse(out)
    } catch(err: any) {
        return spawnResult.stderr.toString()
    }
}

export function load({ url }) {
    var data = {
        entries: [] as [number, Entry][],
        guestbook_url: GUESTBOOK_URL,
        ratelimitedFeat: url.searchParams.get('ratelimited') as string || "",
        page: parseInt(url.searchParams.get('page') || "1") || 1,
        hasNext: false,
        fetchError: "",
    }
    // handle cases where the page query might be a string so we just return back page 1 instead
    data.page = isNaN(data.page) ? 1 : data.page
    data.page = Math.max(data.page, 1)
    if (data.ratelimitedFeat === "get") {
        return data
    }
    const entriesResp = fetchBlocking(GUESTBOOK_URL + "/" + data.page)
    if (typeof entriesResp === "string") {
        data.fetchError = entriesResp
        return data
    }
    const locationRaw = entriesResp.status === 303 ? entriesResp.location : null
    if (locationRaw !== null && locationRaw.length > 0) {
        const location = new URL(locationRaw)
        data.ratelimitedFeat = location.searchParams.get('ratelimited') as string || ""
    }
    if (data.ratelimitedFeat === "get") {
        return data
    }
    data.entries = entriesResp.body.entries
    data.hasNext = entriesResp.body.hasNext
    return data
}