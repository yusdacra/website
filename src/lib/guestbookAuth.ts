import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import type { Cookies } from "@sveltejs/kit";
import base64url from "base64url";

export const callbackUrl = `${PUBLIC_BASE_URL}/guestbook/`

interface TokenResponse {
    accessToken: string,
    tokenType: string,
    scope: string,
}

export const discord = {
    name: 'discord',
    getAuthUrl: (state: string, scopes: string[] = []) => {
        const client_id = env.DISCORD_CLIENT_ID
        const redir_uri = encodeURIComponent(callbackUrl)
        const scope = scopes.join("+")
        return `https://discord.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redir_uri}&scope=${scope}&state=${state}`
    },
    getToken: async (code: string): Promise<TokenResponse> => {
        const api = `https://discord.com/api/oauth2/token`
        const body = new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
            code,
        })
        const resp = await fetch(api, { method: 'POST', body })
        if (resp.status !== 200) {
            throw new Error("woopsies, couldnt get oauth token")
        }
        const tokenResp: any = await resp.json()
        return {
            accessToken: tokenResp.access_token,
            tokenType: tokenResp.token_type,
            scope: tokenResp.scope,
        }
    },
    identifyToken: async (tokenResp: TokenResponse): Promise<string> => {
        const api = `https://discord.com/api/users/@me`
        const resp = await fetch(api, {headers: {
            'Authorization': `${tokenResp.tokenType} ${tokenResp.accessToken}`
        }})
        if (resp.status !== 200) {
            throw new Error("woopsies, couldnt validate access token")
        }
        const body = await resp.json()
        return body.username
    }
}
export const github = {
    name: 'github',
    getAuthUrl: (state: string, scopes: string[] = []) => {
        const client_id = env.GITHUB_CLIENT_ID
        const redir_uri = encodeURIComponent(callbackUrl)
        const scope = encodeURIComponent(scopes.join(" "))
        return `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redir_uri}&scope=${scope}&state=${state}`
    },
    getToken: async (code: string): Promise<TokenResponse> => {
        const api = `https://discord.com/api/oauth2/token`
        const body = new URLSearchParams({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            redirect_uri: callbackUrl,
            code,
        })
        const resp = await fetch(api, { method: 'POST', body, headers: { 'Accept': 'application/json' } })
        if (resp.status !== 200) {
            throw new Error("woopsies, couldnt get oauth token")
        }
        const tokenResp: any = await resp.json()
        return {
            accessToken: tokenResp.access_token,
            tokenType: tokenResp.token_type,
            scope: tokenResp.scope,
        }
    },
    identifyToken: async (tokenResp: TokenResponse): Promise<string> => {
        const api = `https://api.github.com/user`
        const resp = await fetch(api, {headers: {
            'Authorization': `${tokenResp.tokenType} ${tokenResp.accessToken}`
        }})
        if (resp.status !== 200) {
            throw new Error("woopsies, couldnt validate access token")
        }
        const body = await resp.json()
        return body.login
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

export const getAuthClient = (name: string) => {
    switch (name) {
        case "discord":
            return discord
        
        case "github":
            return github
    
        default:
            return null
    }
}

export default {
    callbackUrl,
    discord, github,
    createAuthUrl,
    extractCode,
    getAuthClient,
}