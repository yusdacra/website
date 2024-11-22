import { incrementVisitCount, notifyDarkVisitors } from '$lib/visits.js';

export const csr = true;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always';

export async function load({ request, cookies, url, setHeaders, fetch }) {
    notifyDarkVisitors(url, request) // no await so it doesnt block load

    setHeaders({ 'Cache-Control': 'no-cache' })

    return {
        route: url.pathname,
        visitCount: incrementVisitCount(request, cookies),
    }
}
