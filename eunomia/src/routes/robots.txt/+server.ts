import { getRobotsTxt } from '$lib/robots';

export const GET = async () => {
	return new Response(await getRobotsTxt());
};
