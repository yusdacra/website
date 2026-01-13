import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';
import { initConstellation } from '$lib/constellation';

export const GET = async () => {
    const filePath = join(env.WEBSITE_DATA_DIR, 'constellation', 'og_image.png');

    try {
        await stat(filePath);
    } catch (e) {
        await initConstellation();
    }

    try {
        const file = await readFile(filePath);

        return new Response(file, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (err) {
        console.error(`error serving og image: ${err}`);
        return new Response('not found', { status: 404 });
    }
};
