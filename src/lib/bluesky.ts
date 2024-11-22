import { env } from '$env/dynamic/private'
import { Agent, CredentialSession } from '@atproto/api'
import { get, writable } from 'svelte/store'

const bskyClient = writable<null | Agent>(null)

export const getBskyClient = async () => {
    let client = get(bskyClient)
    if (client === null) {
        client = await loginToBsky()
        bskyClient.set(client)
    }
    return client
}

const loginToBsky = async () => {
    const creds = new CredentialSession(new URL("https://bsky.social"))
    await creds.login({ identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return new Agent(creds)
}