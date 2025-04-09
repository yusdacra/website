import { env } from '$env/dynamic/private';

export const pushNotification = (_content: string) => {
	const content = encodeURIComponent(_content);
	try {
		// post to phone
		fetch(
			`https://api.day.app/${env.BARK_DEVICE_ID}/gaze.systems/${content}?icon=https://gaze.systems/icons/gaze_site.webp`
		);
		// post to discord
		fetch(env.DISCORD_NOTIF_WEBHOOK || '', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ content: _content })
		});
	} catch (err) {
		console.log(`failed to push notification: ${err}`);
	}
};
