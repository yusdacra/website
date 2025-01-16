import { testUa } from '$lib/robots.js';
import { addLastVisitor, incrementVisitCount, notifyDarkVisitors } from '$lib/visits.js';
import { error } from '@sveltejs/kit';

export const csr = true;
export const ssr = true;
export const prerender = false;
export const trailingSlash = 'always'; 

export async function load({ request, cookies, url }) {
    notifyDarkVisitors(url, request) // no await so it doesnt block load

    // block any requests if the user agent is disallowed by our robots txt
    if (await testUa(url.toString(), request.headers.get('user-agent') ?? "unknown user agent") === false) {
        throw error(403, "get a better user agent silly")
    }

    return {
        route: url.pathname,
        visitCount: incrementVisitCount(request, cookies),
        lastVisitors: addLastVisitor(request, cookies),
    }
}
