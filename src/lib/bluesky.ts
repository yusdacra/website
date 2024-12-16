import { env } from '$env/dynamic/private'
import { Bot } from "@skyware/bot";
import { get, writable } from 'svelte/store'

const bskyClient = writable<null | Bot>(null)

export const getBskyClient = async () => {
    let client = get(bskyClient)
    if (client === null) {
        client = await loginToBsky()
        bskyClient.set(client)
    }
    return client
}

export const parseAtUri = (uri: string) => {
    if (uri.startsWith("https://bsky.gaze.systems")) {
        return uri
    }
    return `https://bsky.gaze.systems/post/${uri.split('/').pop()}`
}

const loginToBsky = async () => {
    const bot = new Bot({ service: "https://bsky.social" })
    await bot.login({ identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return bot
}