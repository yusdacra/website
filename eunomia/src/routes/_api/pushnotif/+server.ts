import { checkUrl as checkApiToken } from '$lib/apiToken.js';
import { pushNotification } from '$lib/pushnotif';

export const GET = async ({ url }) => {
	if (!checkApiToken(url)) return new Response();
	const content = url.searchParams.get('content');
	if (content === null) return new Response();
	pushNotification(content);
	return new Response();
};
