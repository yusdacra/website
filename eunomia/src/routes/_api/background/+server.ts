import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const GET = async () => {
    const DATA_DIR = 'data/constellation';
    const OUTPUT_FILE = join(DATA_DIR, 'background.png');

    try {
        const file = readFileSync(OUTPUT_FILE);
        return new Response(file, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=60' // match rotation interval
            }
        });
    } catch (e) {
        console.error('Error serving background:', e);
        return new Response('Not found', { status: 404 });
    }
};
