export const csr = false;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always';

export async function load({ url }) {
    return { route: url.pathname }
}