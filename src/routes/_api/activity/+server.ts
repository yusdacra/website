import { currentActivityToJson, getCurrentActivity } from '$lib/activity';
import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam === null ? null : Number.parseInt(limitParam, 10);
	const activity = getCurrentActivity();
	const selectedActivity =
		limit === null || Number.isNaN(limit) ? activity : activity.slice(0, Math.max(limit, 0));

	return json({
		activity: currentActivityToJson(selectedActivity)
	});
};
