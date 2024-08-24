export const csr = false;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always';

export async function load({ url, setHeaders }) {
    setHeaders({'Cache-Control': 'no-cache'})
    return { route: url.pathname }
}