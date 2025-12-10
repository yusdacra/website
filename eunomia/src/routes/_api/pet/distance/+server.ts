import { distanceTravelled, pushMetric } from '$lib/metrics';
import { isBot } from '$lib/visits';
import { checkUrl as checkApiToken } from '$lib/apiToken.js';

export const POST = async ({ request, url }) => {
	if (isBot(request) || !checkApiToken(url)) return new Response();
	try {
		const delta = parseFloat(await request.text());
		await pushMetric({ gazesys_pet_distance_total: await distanceTravelled.increment(delta) });
	} catch (error) {
		console.log(`error while pushing bounce metric: ${error}`);
	}
	return new Response();
};
