import type { Cookies } from '@sveltejs/kit';
import { hash } from 'node:crypto';

export const scopeCookies = (cookies: Cookies, path: string) => {
	return {
		get: (key: string) => {
			return cookies.get(key);
		},
		set: (key: string, value: string, props: Omit<Parameters<Cookies['set']>[2], 'path'> = {}) => {
			cookies.set(key, value, { ...props, path });
		},
		delete: (key: string, props: Omit<Parameters<Cookies['delete']>[1], 'path'> = {}) => {
			cookies.delete(key, { ...props, path });
		}
	};
};

const cipherChars = ['#', '%', '+', '=', '//'];
export const fancyText = (input: string) => {
	const hashed = hash('sha256', input, 'hex');
	let result = '';
	let idx = 0;
	while (idx < hashed.length) {
		result += cipherChars[hashed.charCodeAt(idx) % cipherChars.length];
		idx += 1;
	}
	return result;
};
