import { updateLastPosts } from '$lib/bluesky';
import { lastFmUpdateNowPlaying } from '$lib/lastfm';
import { steamUpdateNowPlaying } from '$lib/steam';
import { updateCommits } from '$lib/activity';
import { cancelJob, scheduleJob, scheduledJobs } from 'node-schedule';
import {
	incrementFakeVisitCount,
	incrementLegitVisitCount,
	pushMetric,
	sendAllMetrics
} from '$lib/metrics';
import {
	addLastVisitor,
	decrementVisitCount,
	incrementVisitCount,
	notifyDarkVisitors,
	removeLastVisitor
} from '$lib/visits';
import { testUa } from '$lib/robots';
import { error } from '@sveltejs/kit';
import { _fetchEntries } from './routes/guestbook/+page.server';

const UPDATE_LAST_JOB_NAME = 'update steam game, lastfm track, bsky posts, git activity';

if (UPDATE_LAST_JOB_NAME in scheduledJobs) {
	console.log(`${UPDATE_LAST_JOB_NAME} is already running, cancelling so we can start a new one`);
	cancelJob(UPDATE_LAST_JOB_NAME);
}

console.log(`starting ${UPDATE_LAST_JOB_NAME} job...`);
scheduleJob(UPDATE_LAST_JOB_NAME, '*/1 * * * *', async () => {
	console.log(`running ${UPDATE_LAST_JOB_NAME} job...`);
	try {
		await Promise.all([
			steamUpdateNowPlaying(),
			lastFmUpdateNowPlaying(),
			updateLastPosts(),
			_fetchEntries(),
			updateCommits(),
			sendAllMetrics() // send all metrics every minute
		]);
	} catch (err) {
		console.log(`error while running ${UPDATE_LAST_JOB_NAME} job: ${err}`);
	}
}).invoke(); // invoke once immediately

export const handle = async ({ event, resolve }) => {
	notifyDarkVisitors(event.url, event.request); // no await so it doesnt block

	const isPrefetch = () => {
		return (
			event.request.headers.get('Sec-Purpose')?.includes('prefetch') ||
			event.request.headers.get('Purpose')?.includes('prefetch') ||
			event.request.headers.get('x-purpose')?.includes('preview') ||
			event.request.headers.get('x-moz')?.includes('prefetch')
		);
	};
	const isApi = () => {
		return event.url.pathname.startsWith('/_api');
	};
	const isRss = () => {
		return event.url.pathname.endsWith('/_rss');
	};

	// block any requests if the user agent is disallowed by our robots txt
	const isFakeVisit =
		(await testUa(event.url.toString(), event.request.headers.get('user-agent') ?? '')) === false;
	if (isFakeVisit) {
		pushMetric({ gazesys_visit_fake_total: incrementFakeVisitCount() });
		throw error(403, 'get a better user agent silly');
	}

	// only push metric if legit page visit (still want rss to count here though)
	const isPageVisit = !isApi() && !isPrefetch();
	if (isPageVisit) pushMetric({ gazesys_visit_real_total: incrementLegitVisitCount() });

	// only add visitors if its a "legit" page visit
	let id = null;
	let valid = false;
	if (isPageVisit && !isRss()) {
		id = addLastVisitor(event.request, event.cookies);
		valid = incrementVisitCount(event.request, event.cookies);
	}

	// actually resolve event
	const resp = await resolve(event);
	// remove visitors if it was a 404
	if (resp.status === 404) {
		if (id !== null) removeLastVisitor(id);
		if (valid) decrementVisitCount();
	}

	return resp;
};
