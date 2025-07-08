import { newToken as getApiToken } from '$lib/apiToken.js';
import { bounceCount, distanceTravelled } from '$lib/metrics.js';
import { lastVisitors, visitCount } from '$lib/visits.js';
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

	const eyePositions = [];
	const usedPositions = [];
	for (let i = 0; i < Math.min(visitors.size, 10); i++) {
		let maxMinDistance = 0;
		let bestPosition = null;

		// Try multiple positions and keep the one with largest minimum distance to existing points
		for (let attempt = 0; attempt < 50; attempt++) {
			const sidePreference = Math.random() < 0.5;
			const testLeft = sidePreference
				? Math.random() * 30 // Left side
				: 60 + Math.random() * 30; // Right side
			const testTop = Math.random() * 80;

			let currentMinDistance = Infinity;

			// Calculate minimum distance to all existing points
			for (const pos of usedPositions) {
				const distance = Math.sqrt(
					Math.pow(testLeft - pos.left, 2) + Math.pow(testTop - pos.top, 2)
				);
				currentMinDistance = Math.min(currentMinDistance, distance);
			}

			// If this position has a larger minimum distance, keep it
			if (currentMinDistance > maxMinDistance) {
				maxMinDistance = currentMinDistance;
				bestPosition = { left: testLeft, top: testTop };
			}
		}

		// Use the best position found
		const left = bestPosition ? bestPosition.left : Math.random() * 90;
		const top = bestPosition ? bestPosition.top : Math.random() * 80;

		usedPositions.push({ left, top });
		eyePositions.push([top, left]);
	}

	return {
		route: url.pathname,
		petTotalBounce: bounceCount.get(),
		petTotalDistance: distanceTravelled.get(),
		visitCount: get(visitCount),
		lastVisitors: visitors,
		recentVisitCount,
		eyePositions,
		apiToken: getApiToken()
	};
}
