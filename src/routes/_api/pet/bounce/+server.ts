import { incrementBounceCount, pushMetric } from '$lib/metrics';
import { isBot } from '$lib/visits';

export const GET = async ({ request }) => {
	if (isBot(request)) return new Response();
	try {
		await pushMetric({ gazesys_pet_bounce_total: incrementBounceCount() });
	} catch (error) {
		console.log(`error while pushing bounce metric: ${error}`);
	}
	return new Response();
};
