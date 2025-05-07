import { pushNotification } from '$lib/pushnotif';

export const GET = async ({ url }) => {
	const content = url.searchParams.get('content');
	if (content === null) return new Response();
	pushNotification(content);
	return new Response();
};
