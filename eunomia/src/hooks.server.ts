import { updateLastPosts } from './lib/bluesky.ts';
import { updateNowPlayingTrack } from '$lib/lastfm.ts';
import { steamUpdateNowPlaying } from '$lib/steam.ts';
import { updateCommits } from '$lib/activity.ts';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import {
	incrementFakeVisitCount,
	incrementLegitVisitCount,
	pushMetric,
	sendAllMetrics
} from '$lib/metrics.ts';
import { addLastVisitor, notifyDarkVisitors, removeLastVisitor } from '$lib/visits.ts';
import { testUa } from '$lib/robots.ts';
import { error, type Handle } from '@sveltejs/kit';
import { _fetchEntries } from './routes/(site)/guestbook/+page.server.ts';
import { sequence } from '@sveltejs/kit/hooks';
import { initConstellation, renderConstellation } from '$lib/constellation.ts';

// Init constellation on startup (non-blocking)
initConstellation();

const updateNowPlaying = async () => {
	try {
		await Promise.all([steamUpdateNowPlaying(), updateNowPlayingTrack()]);
	} catch (err) {
		console.log(`error while updating: ${err}`);
	}
};
const refreshContent = async () => {
	try {
		await Promise.all([updateLastPosts(), _fetchEntries(), updateCommits(), sendAllMetrics()]);
	} catch (err) {
		console.log(`error while updating: ${err}`);
	}
};

await Promise.all([updateNowPlaying(), refreshContent()]);

const scheduler = new ToadScheduler();
scheduler.addSimpleIntervalJob(
	new SimpleIntervalJob(
		{ seconds: 5 },
		new AsyncTask('updateNowPlaying task', updateNowPlaying, (err) =>
			console.log(`error while updateNowPlaying: ${err}`)
		)
	)
);
scheduler.addSimpleIntervalJob(
	new SimpleIntervalJob(
		{ seconds: 30 },
		new AsyncTask('refreshContent task', refreshContent, (err) =>
			console.log(`error while refreshContent: ${err}`)
		)
	)
);
scheduler.addSimpleIntervalJob(
	new SimpleIntervalJob(
		{ minutes: 1 },
		new AsyncTask('rotateConstellation task', renderConstellation, (err) =>
			console.log(`error while rotateConstellation: ${err}`)
		)
	)
);
scheduler.addSimpleIntervalJob(
	new SimpleIntervalJob(
		{ days: 1 },
		new AsyncTask('initConstellation task', initConstellation, (err) =>
			console.log(`error while initConstellation: ${err}`)
		)
	)
);

const corsHandler = (allowedOrigins = ['*']) => {
	return async ({ event, resolve }: Parameters<Handle>[0]) => {
		const origin = event.request.headers.get('origin');

		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		};

		if (allowedOrigins.includes('*')) corsHeaders['Access-Control-Allow-Origin'] = '*';
		else if (origin && allowedOrigins.includes(origin)) {
			corsHeaders['Access-Control-Allow-Origin'] = origin;
			corsHeaders['Access-Control-Allow-Credentials'] = 'true';
		}

		if (event.request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

		const response = await resolve(event);

		Object.entries(corsHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});

		return response;
	};
};

const handler = async ({ event, resolve }: Parameters<Handle>[0]) => {
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
	if (isPageVisit && !isRss()) {
		id = addLastVisitor(event.request, event.cookies);
	}

	// actually resolve event
	const resp = await resolve(event);
	// remove visitors if it was a 404
	if (resp.status === 404) {
		if (id !== null) removeLastVisitor(id);
	}

	return resp;
};

const allowedOrigins = ['https://gaze.systems', 'https://ptr.pet', 'https://poor.dog'];
export const handle = sequence(corsHandler(allowedOrigins), handler);
