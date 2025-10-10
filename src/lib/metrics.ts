import { env } from '$env/dynamic/private';
import { pushMetrics } from 'prometheus-remote-write';
import { createFileCounter } from './counter';

const endpoint = env.PROMETHEUS_URL;

export const pushMetric = async (
	metrics: Record<string, number>,
	labels: Record<string, string> = {}
) => {
	if (endpoint === undefined) return;
	try {
		const result = await pushMetrics(metrics, {
			url: endpoint,
			labels: {
				service: 'website',
				...labels
			}
		});
		if (result.status != 204) {
			throw new Error(`failed to push metrics: ${result.status} ${result.errorMessage}`);
		}
	} catch (err) {
		console.log(`failed to push metrics: ${err}`);
	}
};

export const sendAllMetrics = async () => {
	try {
		await pushMetric({
			gazesys_pet_bounce_total: bounceCount.get(),
			gazesys_visit_fake_total: fakeVisitCount.get(),
			gazesys_visit_real_total: legitVisitCount.get(),
			gazesys_pet_distance_total: distanceTravelled.get()
		});
	} catch (error) {
		console.log(`failed to push metrics: ${error}`);
	}
};

export const bounceCount = await createFileCounter(`${env.WEBSITE_DATA_DIR}/bouncecount`);
export const incrementBounceCount = bounceCount.increment;

export const legitVisitCount = await createFileCounter(`${env.WEBSITE_DATA_DIR}/legitvisitcount`);
export const incrementLegitVisitCount = legitVisitCount.increment;

export const fakeVisitCount = await createFileCounter(`${env.WEBSITE_DATA_DIR}/fakevisitcount`);
export const incrementFakeVisitCount = fakeVisitCount.increment;

export const distanceTravelled = await createFileCounter(
	`${env.WEBSITE_DATA_DIR}/distancetravelled`
);
