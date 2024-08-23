import { dev } from "$app/environment";
import { DISCORD_CLIENT_ID, GITHUB_CLIENT_ID } from "$env/static/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import type { Cookies } from "@sveltejs/kit";
import { Discord, generateState, GitHub } from "arctic";

export const callbackUrl = `${PUBLIC_BASE_URL}/guestbook/`

export const discord = new Discord(DISCORD_CLIENT_ID, "", callbackUrl)
export const github = new GitHub(GITHUB_CLIENT_ID, "", callbackUrl)

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