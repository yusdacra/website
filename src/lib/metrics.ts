import { env } from '$env/dynamic/private';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { pushMetrics } from 'prometheus-remote-write';
import { get, writable } from 'svelte/store';

export const pushMetric = async (metrics: Record<string, number>) => {
	const result = await pushMetrics(metrics, {
		url: env.PROMETHEUS_URL,
		labels: {
			service: 'website'
		}
	});
	if (result.status != 200) {
		throw new Error(`failed to push metrics: ${result.status} ${result.errorMessage}`);
	}
};

const bounceCountFile = `${env.WEBSITE_DATA_DIR}/bouncecount`;
const bounceCount = writable(
	parseInt(existsSync(bounceCountFile) ? readFileSync(bounceCountFile).toString() : '0')
);

export const incrementBounceCount = () => {
	let currentBounceCount = get(bounceCount);
	// increment current and write to the store
	currentBounceCount += 1;
	bounceCount.set(currentBounceCount);
	// write the bounce count to a file so we can load it later again
	writeFileSync(bounceCountFile, currentBounceCount.toString());
	return currentBounceCount;
};
