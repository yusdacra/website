import { redirect } from '@sveltejs/kit';

export const GET = async () => {
	redirect(301, 'https://bsky.app/profile/did:plc:dfl62fgb7wtjj3fcbb72naae/rss');
};
