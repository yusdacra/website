import { bounceCount, distanceTravelled } from '$lib/metrics.js';
import { lastVisitors, visitCount } from '$lib/visits.js';
import { localBounces, localDistanceTravelled } from '../components/pet.svelte';
import { get } from 'svelte/store';

export const csr = true;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always';

export async function load({ url }) {
	const visitors = get(lastVisitors);
	let recentVisitCount = 0;
	for (const [, visitor] of visitors) {
		recentVisitCount += visitor.visits.length;
	}

	return {
		route: url.pathname,
		petTotalBounce: bounceCount.get(),
		petTotalDistance: distanceTravelled.get(),
		visitCount: get(visitCount),
		lastVisitors: visitors,
		recentVisitCount
	};
}
