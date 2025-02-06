import { env } from '$env/dynamic/private'
import { Bot, Post } from "@skyware/bot";
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

const loginToBsky = async () => {
    const bot = new Bot({ service: "https://bsky.social" })
    await bot.login({ identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return bot
}

export const getUserPosts = async (did: string, includeReposts: boolean = false, count: number = 10) => {
    const client = await getBskyClient()
    let feedCursor = undefined;
    let posts: Post[] = []
    // fetch requested amount of posts
    while (posts.length < count || feedCursor === undefined) {
        let feedData = await client.getUserPosts(
            did, { limit: count, filter: 'posts_no_replies', cursor: feedCursor }
        )
        posts.push(...feedData.posts.filter((post) => !includeReposts && post.author.did === did))
        feedCursor = feedData.cursor
    }
    return posts
}