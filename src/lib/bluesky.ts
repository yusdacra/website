import { env } from '$env/dynamic/private'
import { Agent, CredentialSession, RichText } from '@atproto/api'
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

export const postToBsky = async (text: string) => {
    let client = await getBskyClient()
    const rt = new RichText({ text })
    await rt.detectFacets(client)
    const {uri} = await client.post({
        text: rt.text,
        facets: rt.facets,
    })
    return uri
}

const loginToBsky = async () => {
    const creds = new CredentialSession(new URL("https://bsky.social"))
    await creds.login({ identifier: 'gaze.systems', password: env.BSKY_PASSWORD ?? "" })
    return new Agent(creds)
}