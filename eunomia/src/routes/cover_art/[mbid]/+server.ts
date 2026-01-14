import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const mbid = params.mbid?.replace('.jpg', '');

	if (!mbid) {
		throw error(404, 'Missing MBID');
	}

	const cacheDir = `${env.WEBSITE_DATA_DIR}/cover_art_cache`;
	const filePath = `${cacheDir}/${mbid}.jpg`;

	try {
		const file = await Deno.readFile(filePath);
		return new Response(file, {
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		throw error(404, 'cover art not found');
	}
};
