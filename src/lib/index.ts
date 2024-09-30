import type { Cookies } from '@sveltejs/kit'

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