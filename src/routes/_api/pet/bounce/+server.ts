import { incrementBounceCount, pushMetric } from '$lib/metrics';
import { isBot } from '$lib/visits';
import { checkUrl as checkApiToken } from '$lib/apiToken.js';

export const GET = async ({ request, url }) => {
	if (isBot(request) || !checkApiToken(url)) return new Response();
	try {
		await pushMetric({ gazesys_pet_bounce_total: incrementBounceCount() });
	} catch (error) {
		console.log(`error while pushing bounce metric: ${error}`);
	}
	return new Response();
};
