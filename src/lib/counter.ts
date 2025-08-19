import { get, writable } from 'svelte/store';

/**
 * Creates a persistent counter that is stored in a file
 * @param fileName The name of the file to store the count in
 * @param initialValue The initial value if the file doesn't exist
 * @returns An object with methods to get, increment, and set the count
 */
export const createFileCounter = async (filePath: string, initialValue: number = 0) => {
	const counter = writable(
		parseInt(
			(await Bun.file(filePath).exists())
				? await Bun.file(filePath).text()
				: initialValue.toString()
		)
	);

	const saveToFile = async (value: number) => {
		await Bun.write(filePath, value.toString());
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
