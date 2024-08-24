import { GUESTBOOK_BASE_URL } from '$env/static/private'
import { redirect, type Cookies } from '@sveltejs/kit'
import auth from '$lib/guestbookAuth'

interface Entry {
    author: string,
    content: string,
    timestamp: number,
}

const scopeCookies = (cookies: Cookies) => {
    return {
        get: (key: string) => {
            return cookies.get(key)
        },
        set: (key: string, value: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.set(key, value, { ...props, path: "/guestbook/" })
        },
        delete: (key: string, props: import('cookie').CookieSerializeOptions = {}) => {
            cookies.delete(key, { ...props, path: "/guestbook/" })
        }
    }
}

const postAction = (client: any, scopes: string[]) => {
    return async ({ request, cookies }: { request: Request, cookies: Cookies }) => {
        const scopedCookies = scopeCookies(cookies)
        scopedCookies.set("postAuth", client.name)
        const form = await request.formData()
        const content = form.get("content")?.toString().substring(0, 512)
        if (content === undefined) {
            scopedCookies.set("sendError", "content field is missing")
            redirect(303, auth.callbackUrl)
        }
        // save form content in a cookie
        const params = new URLSearchParams({ content })
        scopedCookies.set("postData", params.toString())
        // get auth url to redirect user to
        const authUrl = auth.createAuthUrl((state) => client.getAuthUrl(state, scopes), cookies)
        redirect(303, authUrl)
    }
}

export const actions = {
    post_discord: postAction(auth.discord, ["identify"]),
    post_github: postAction(auth.github, []),
}

export async function load({ url, fetch, cookies }) {
    const scopedCookies = scopeCookies(cookies)
    var data = {
        entries: [] as [number, Entry][],
        page: parseInt(url.searchParams.get('page') || "1"),
        hasNext: false,
        sendError: scopedCookies.get("sendError") || "",
        getError: "",
        sendRatelimited: scopedCookies.get('sendRatelimited') || "",
        getRatelimited: false,
    }
    const rawPostData = scopedCookies.get("postData") || null
    const postAuth = scopedCookies.get("postAuth") || null
    if (rawPostData !== null && postAuth !== null) {
        // delete the postData cookie after we got it cause we dont need it anymore
        scopedCookies.delete("postData")
        scopedCookies.delete("postAuth")
        // check if we are landing from an auth from a post action
        let code: string | null = null
        // try to get the code, fails if invalid oauth request
        try {
            code = auth.extractCode(url, cookies)
        } catch (err: any) {
            data.sendError = err.toString()
        }
        // if we do have a code, then make the access token request
        const authClient = auth.getAuthClient(postAuth)
        if (authClient !== null && code !== null) {
            // get and validate access token, also get username
            let author: string
            try {
                const tokenResp = await authClient.getToken(code)
                author = await authClient.identifyToken(tokenResp)
            } catch(err: any) {
                scopedCookies.set("sendError", `oauth failed: ${err.toString()}`)
                redirect(303, auth.callbackUrl)
            }
            let respRaw: Response
            try {
                const postData = new URLSearchParams(rawPostData)
                // set author to the identified value we got
                postData.set('author', author)
                // return error if content was not set or if empty
                const content = postData.get('content')
                if (content === null || content.trim().length === 0) {
                    scopedCookies.set("sendError", `content field was empty`)
                    redirect(303, auth.callbackUrl)
                }
                // set content, make sure to trim it
                postData.set('content', content.substring(0, 512).trim())
                respRaw = await fetch(GUESTBOOK_BASE_URL, { method: 'POST', body: postData })
            } catch (err: any) {
                scopedCookies.set("sendError", `${err.toString()} (is guestbook server running?)`)
                redirect(303, auth.callbackUrl)
            }
            if (respRaw.status === 429) {
                scopedCookies.set("sendRatelimited", "true")
            }
            redirect(303, auth.callbackUrl)
        }
    }
    // delete the cookies after we get em since we dont really need these more than once
    scopedCookies.delete("sendError")
    scopedCookies.delete("sendRatelimited")
    // handle cases where the page query might be a string so we just return back page 1 instead
    data.page = isNaN(data.page) ? 1 : data.page
    data.page = Math.max(data.page, 1)
    let respRaw: Response
    try {
        const count = 5
        const offset = (data.page - 1) * count
        respRaw = await fetch(`${GUESTBOOK_BASE_URL}?offset=${offset}&count=${count}`)
    } catch (err: any) {
        data.getError = `${err.toString()} (is guestbook server running?)`
        return data
    }
    data.getRatelimited = respRaw.status === 429
    if (!data.getRatelimited) {
        let body: any
        try {
            body = await respRaw.json()
        } catch (err: any) {
            data.getError = `invalid body? (${err.toString()})`
            return data
        }
        data.entries = body.entries
        data.hasNext = body.hasNext
    }
    return data
}