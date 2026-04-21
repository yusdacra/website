import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';

export const GET = async ({ params }) => {
	const mbid = params.mbid?.replace('.webp', '')?.replace('.jpg', '');

	if (!mbid) {
		throw error(404, 'Missing MBID');
	}

	const cacheDir = `${env.WEBSITE_DATA_DIR}/cover_art_cache`;
	const filePath = `${cacheDir}/${mbid}.webp`;

	try {
		const file = await readFile(filePath);
		return new Response(file, {
			headers: {
				'Content-Type': 'image/webp',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		throw error(404, 'cover art not found');
	}
};
