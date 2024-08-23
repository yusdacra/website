import { GUESTBOOK_BASE_URL } from '$env/static/private'
import { PUBLIC_BASE_URL } from '$env/static/public'
import { redirect } from '@sveltejs/kit'

interface Entry {
    author: String,
    content: String,
    timestamp: number,
}

export const actions = {
    default: async ({ request, cookies }) => {
        const body = await request.text()
        let respRaw: Response
        try {
            respRaw = await fetch(`${GUESTBOOK_BASE_URL}`, { method: 'POST', body })
        } catch (err: any) {
            cookies.set("sendError", err.toString(), { path: "/guestbook" })
            redirect(303, `${PUBLIC_BASE_URL}/guestbook/`)
        }
        if (respRaw.status === 429) {
            cookies.set("sendRatelimited", "true", { path: "/guestbook" })
        }
        redirect(303, `${PUBLIC_BASE_URL}/guestbook/`)
    }
}

export async function load({ url, fetch, cookies }) {
    var data = {
        entries: [] as [number, Entry][],
        page: parseInt(url.searchParams.get('page') || "1"),
        hasNext: false,
        sendError: cookies.get("sendError") || "",
        getError: "",
        sendRatelimited: cookies.get('sendRatelimited') || "",
        getRatelimited: false,
    }
    // delete the cookies after we get em since we dont really need these more than once
    cookies.delete("sendError", { path: "/guestbook" })
    cookies.delete("sendRatelimited", { path: "/guestbook" })
    // handle cases where the page query might be a string so we just return back page 1 instead
    data.page = isNaN(data.page) ? 1 : data.page
    data.page = Math.max(data.page, 1)
    let respRaw: Response
    try {
        respRaw = await fetch(GUESTBOOK_BASE_URL + "/" + data.page)
    } catch (err: any) {
        data.getError = err.toString()
        return data
    }
    data.getRatelimited = respRaw.status === 429
    if (!data.getRatelimited) {
        let body: any
        try {
            body = await respRaw.json()
        } catch (err: any) {
            data.getError = err.toString()
            return data
        }
        data.entries = body.entries
        data.hasNext = body.hasNext
    }
    return data
}