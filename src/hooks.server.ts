import { updateLastPosts } from '$lib/bluesky';
import { getLastTrack, updateNowPlayingTrack } from '$lib/lastfm';
import { steamReadLastGame, steamUpdateNowPlaying } from '$lib/steam';
import { updateCommits } from '$lib/activity';
import { ToadScheduler, SimpleIntervalJob, Task, AsyncTask } from 'toad-scheduler';
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
import { _fetchEntries } from './routes/(site)/guestbook/+page.server';

const update = async () => {
	try {
		await Promise.all([
			steamUpdateNowPlaying(),
			updateNowPlayingTrack(),
			updateLastPosts(),
			_fetchEntries(),
			updateCommits(),
			sendAllMetrics()
		]);
	} catch (err) {
		console.log(`error while updating: ${err}`);
	}
};

await update();

const scheduler = new ToadScheduler();
const task = new AsyncTask('update task', update, (err) =>
	console.log(`error while updating: ${err}`)
);
const job = new SimpleIntervalJob({ seconds: 5 }, task);
scheduler.addSimpleIntervalJob(job);

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
		pushMetric({ gazesys_visit_fake_total: await incrementFakeVisitCount() });
		throw error(403, 'get a better user agent silly');
	}

	// only push metric if legit page visit (still want rss to count here though)
	const isPageVisit = !isApi() && !isPrefetch();
	if (isPageVisit) pushMetric({ gazesys_visit_real_total: await incrementLegitVisitCount() });

	// only add visitors if its a "legit" page visit
	let id = null;
	let valid = false;
	if (isPageVisit && !isRss()) {
		id = addLastVisitor(event.request, event.cookies);
		valid = await incrementVisitCount(event.request, event.cookies);
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
