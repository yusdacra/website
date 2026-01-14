import { readFile, writeFile } from 'node:fs/promises';
import { get, writable } from 'svelte/store';

/**
 * Creates a persistent counter that is stored in a file
 * @param fileName The name of the file to store the count in
 * @param initialValue The initial value if the file doesn't exist
 * @returns An object with methods to get, increment, and set the count
 */
export const createFileCounter = async (filePath: string, initialValue: number = 0) => {
	let countRaw: string | null = null;
	try {
		countRaw = await readFile(filePath, 'utf-8');
	} catch {
		// we use initial value if not found
	}

	const counter = writable(parseInt(countRaw ?? initialValue.toString()));

	const saveToFile = async (value: number) => {
		await writeFile(filePath, value.toString());
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
