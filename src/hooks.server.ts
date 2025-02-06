import { updateLastPosts } from '$lib/bluesky';
import { lastFmUpdateNowPlaying } from '$lib/lastfm';
import { steamUpdateNowPlaying } from '$lib/steam'
import { cancelJob, scheduleJob, scheduledJobs } from 'node-schedule'

const UPDATE_LAST_JOB_NAME = "update steam game, lastfm track, bsky posts"

if (UPDATE_LAST_JOB_NAME in scheduledJobs) {
    console.log(`${UPDATE_LAST_JOB_NAME} is already running, cancelling so we can start a new one`)
    cancelJob(UPDATE_LAST_JOB_NAME)
}

console.log(`starting ${UPDATE_LAST_JOB_NAME} job...`);
scheduleJob(UPDATE_LAST_JOB_NAME, "*/1 * * * *", async () => {
    console.log(`running ${UPDATE_LAST_JOB_NAME} job...`)
    await Promise.all([steamUpdateNowPlaying(), lastFmUpdateNowPlaying(), updateLastPosts()])
}).invoke() // invoke once immediately