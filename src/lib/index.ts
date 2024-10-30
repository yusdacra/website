import type { Cookies } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { writable } from 'svelte/store'
import { existsSync, readFileSync } from 'fs'
import { Agent, CredentialSession } from '@atproto/api'

export const scopeCookies = (cookies: Cookies, path: string) => {
    return {
        get: (key: string) => {
            return cookies.get(key)
        },
        set: (key: string, value: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.set(key, value, { ...props, path })
        },
        delete: (key: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.delete(key, { ...props, path })
        }
    }
}

export const visitCountFile = `${env.WEBSITE_DATA_DIR}/visitcount`
export const visitCount = writable(parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0'));

const loginToBsky = () => {
    const creds = new CredentialSession(new URL("https://bsky.social"))
    creds.login({identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return new Agent(creds)
}
export const bskyClient = writable(loginToBsky())