import type { Cookies } from '@sveltejs/kit'
import { WEBSITE_DATA_DIR } from '$env/static/private'
import { existsSync, readFileSync } from 'fs'
import { writable } from 'svelte/store'

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

export const visitCountFile = `${WEBSITE_DATA_DIR}/visitcount`
export const visitCount = writable(parseInt(existsSync(visitCountFile) ? readFileSync(visitCountFile).toString() : '0'));