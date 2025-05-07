import { distanceTravelled, pushMetric } from '$lib/metrics';
import { isBot } from '$lib/visits';

export const POST = async ({ request }) => {
	if (isBot(request)) return new Response();
	try {
		const delta = parseFloat(await request.text());
		await pushMetric({ gazesys_pet_distance_total: distanceTravelled.increment(delta) });
	} catch (error) {
		console.log(`error while pushing bounce metric: ${error}`);
	}
	return new Response();
};
