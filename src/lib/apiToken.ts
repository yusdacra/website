import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';

const tokens = writable<Map<string, number>>(new Map());

export const newToken = () => {
	const token = nanoid(100);
	tokens.update((v) => v.set(token, Date.now()));
	return token;
};
export const useToken = (token: string) => {
	const _tokens = get(tokens);
	// delete older tokens
	for (const [_token, timestamp] of _tokens) {
		if (Date.now() - timestamp > 30 * 60 * 1000) {
			_tokens.delete(_token);
		}
	}
	tokens.set(_tokens);
	return _tokens.has(token);
};

export const checkUrl = (url: URL) => {
	const token = url.searchParams.get('_token');
	return token !== null && useToken(token);
};
