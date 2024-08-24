import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import type { Cookies } from "@sveltejs/kit";
import base64url from "base64url";

export const callbackUrl = `${PUBLIC_BASE_URL}/guestbook/`

export const discord = {
    getAuthUrl: (state: string, scopes: string[] = []) => {
        const client_id = env.DISCORD_CLIENT_ID
        const redir_uri = encodeURIComponent(callbackUrl)
        const scope = scopes.join("+")
        return `https://discord.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redir_uri}&scope=${scope}&state=${state}`
    }
}
export const github = {
    getAuthUrl: (state: string, scopes: string[] = []) => {
        const client_id = env.GITHUB_CLIENT_ID
        const redir_uri = encodeURIComponent(callbackUrl)
        const scope = encodeURIComponent(scopes.join(" "))
        return `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redir_uri}&scope=${scope}&state=${state}`
    }
}

export const generateState = () => {
    const randomValues = new Uint8Array(32)
    crypto.getRandomValues(randomValues)
    return base64url(Buffer.from(randomValues))
}

export const createAuthUrl = (authCb: (state: string) => URL, cookies: Cookies) => {
    const state = generateState()
    const url = authCb(state)
    cookies.set("state", state, {
        secure: !dev,
        path: "/guestbook/",
        httpOnly: true,
        maxAge: 60 * 10,
    })
    return url
}

export const extractCode = (url: URL, cookies: Cookies) => {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = cookies.get("state");

    if (code === null || state === null) {
        return null
    }
    if (state !== storedState) {
        throw new Error("Invalid OAuth request");
    }

    return code
}

export default {
    callbackUrl,
    discord, github,
    createAuthUrl,
    extractCode,
}