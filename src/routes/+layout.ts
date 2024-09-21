export const csr = false;
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';

export async function load({ url, setHeaders }) {
    setHeaders({'Cache-Control': 'no-store'})
    return { route: url.pathname }
}