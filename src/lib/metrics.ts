import { env } from '$env/dynamic/private';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { pushMetrics } from 'prometheus-remote-write';
import { get, writable } from 'svelte/store';

const endpoint = env.PROMETHEUS_URL;

export const pushMetric = async (
	metrics: Record<string, number>,
	labels: Record<string, string> = {}
) => {
	if (endpoint === undefined) return;
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
};

export const sendAllMetrics = async () => {
	try {
		await pushMetric({
			gazesys_pet_bounce_total: bounceCount.get(),
			gazesys_visit_fake_total: fakeVisitCount.get(),
			gazesys_visit_real_total: legitVisitCount.get()
		});
	} catch (error) {
		console.log(`failed to push metrics: ${error}`);
	}
};

/**
 * Creates a persistent counter that is stored in a file
 * @param fileName The name of the file to store the count in
 * @param initialValue The initial value if the file doesn't exist
 * @returns An object with methods to get, increment, and set the count
 */
export const createFileCounter = (fileName: string, initialValue: number = 0) => {
	const filePath = `${env.WEBSITE_DATA_DIR}/${fileName}`;
	const counter = writable(
		parseInt(existsSync(filePath) ? readFileSync(filePath).toString() : initialValue.toString())
	);

	const saveToFile = (value: number) => {
		writeFileSync(filePath, value.toString());
		return value;
	};

	return {
		get: () => get(counter),
		increment: (amount: number = 1) => {
			const currentValue = get(counter) + amount;
			counter.set(currentValue);
			return saveToFile(currentValue);
		},
		set: (value: number) => {
			counter.set(value);
			return saveToFile(value);
		},
		subscribe: counter.subscribe
	};
};

export const bounceCount = createFileCounter('bouncecount');
export const incrementBounceCount = bounceCount.increment;

export const legitVisitCount = createFileCounter('legitvisitcount');
export const incrementLegitVisitCount = legitVisitCount.increment;

export const fakeVisitCount = createFileCounter('fakevisitcount');
export const incrementFakeVisitCount = fakeVisitCount.increment;
