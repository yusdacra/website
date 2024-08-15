import { dev } from '$app/environment';

export const csr = dev;
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';

export async function load({ url }) {
    return { route: url.pathname }
}