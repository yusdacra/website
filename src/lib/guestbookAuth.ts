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

class OauthConfig {
    clientId: string;
    clientSecret: string;

    authUrl: URL;
    tokenUrl: URL;

    joinScopes: (scopes: string[]) => string = (scopes) => scopes.join("+");
    getAuthParams: (params: Record<string, string>, config: OauthConfig) => Record<string, string> = (params) => { return params };
    getTokenParams: (params: Record<string, string>, config: OauthConfig) => Record<string, string> = (params) => { return params };
    extractTokenResponse: (tokenResp: any) => TokenResponse = (tokenResp) => {
        return {
            accessToken: tokenResp.access_token,
            tokenType: tokenResp.token_type,
            scope: tokenResp.scope,
        }
    };

    tokenReqHeaders: Record<string, string> = {};

    constructor(clientId: string, clientSecret: string, authUrl: URL | string, tokenUrl: URL | string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.authUrl = typeof authUrl === 'string' ? new URL(authUrl) : authUrl
        this.tokenUrl = typeof tokenUrl === 'string' ? new URL(tokenUrl) : tokenUrl
    }

    withJoinScopes(f: typeof this.joinScopes) {
        this.joinScopes = f
        return this
    }
    withGetAuthParams(f: typeof this.getAuthParams) {
        this.getAuthParams = f
        return this
    }
    withGetTokenParams(f: typeof this.getTokenParams) {
        this.getTokenParams = f
        return this
    }
    withExtractTokenResponse(f: typeof this.extractTokenResponse) {
        this.extractTokenResponse = f
        return this
    }
    withTokenRequestHeaders(f: typeof this.tokenReqHeaders) {
        this.tokenReqHeaders = f
        return this
    }
}

const genericOauthClient = (oauthConfig: OauthConfig) => {
    return {
        getAuthUrl: (state: string, scopes: string[] = []) => {
            const redirect_uri = callbackUrl
            const scope = oauthConfig.joinScopes(scopes)
            const baseParams = {
                client_id: oauthConfig.clientId,
                redirect_uri,
                scope,
                state,
            }
            const params = oauthConfig.getAuthParams(baseParams, oauthConfig)
            const urlParams = new URLSearchParams(params)
            const urlRaw = `${oauthConfig.authUrl}?${urlParams.toString()}`
            return new URL(urlRaw)
        },
        getToken: async (code: string): Promise<TokenResponse> => {
            const api = oauthConfig.tokenUrl
            const baseParams = {
                client_id: oauthConfig.clientId,
                client_secret: oauthConfig.clientSecret,
                redirect_uri: callbackUrl,
                code,
            }
            const body = new URLSearchParams(oauthConfig.getTokenParams(baseParams, oauthConfig))
            const resp = await fetch(api, { method: 'POST', body, headers: oauthConfig.tokenReqHeaders })
            if (resp.status !== 200) {
                throw new Error("woopsies, couldnt get oauth token")
            }
            const tokenResp: any = await resp.json()
            return oauthConfig.extractTokenResponse(tokenResp)
        }
    }
}

export const discord = {
    name: 'discord',
    ...genericOauthClient(
        new OauthConfig(
            env.DISCORD_CLIENT_ID,
            env.DISCORD_CLIENT_SECRET,
            'https://discord.com/oauth2/authorize',
            'https://discord.com/api/oauth2/token',
        )
            .withGetAuthParams((params) => { return { ...params, response_type: 'code', prompt: 'none' } })
            .withGetTokenParams((params) => { return { ...params, grant_type: 'authorization_code' } })
    ),
    identifyToken: async (tokenResp: TokenResponse): Promise<string> => {
        const api = `https://discord.com/api/users/@me`
        const resp = await fetch(api, {
            headers: {
                'Authorization': `${tokenResp.tokenType} ${tokenResp.accessToken}`
            }
        })
        if (resp.status !== 200) {
            throw new Error("woopsies, couldnt validate access token")
        }
        const body = await resp.json()
        return body.username
    }
}

export const github = {
    name: 'github',
    ...genericOauthClient(
        new OauthConfig(
            env.GITHUB_CLIENT_ID,
            env.GITHUB_CLIENT_SECRET,
            'https://github.com/login/oauth/authorize',
            'https://github.com/login/oauth/access_token',
        )
            .withJoinScopes((s) => { return s.join(" ") })
            .withTokenRequestHeaders({ 'Accept': 'application/json' })
    ),
    identifyToken: async (tokenResp: TokenResponse): Promise<string> => {
        const api = `https://api.github.com/user`
        const resp = await fetch(api, {
            headers: {
                'Authorization': `${tokenResp.tokenType} ${tokenResp.accessToken}`
            }
        })
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