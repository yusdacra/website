import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompress, gzip } from 'node:zlib';
import { env } from '$env/dynamic/private';
import { initConstellation } from '$lib/constellation';

export const GET = async ({ request }: { request: Request }) => {
    const filePath = join(env.WEBSITE_DATA_DIR, 'constellation', 'background.svg');

    try {
        await stat(filePath);
    } catch (e) {
        await initConstellation();
    }

    try {
        const file = await readFile(filePath);
        const acceptEncoding = request.headers.get('accept-encoding') || '';

        let content: any = file;
        let contentEncoding: string | null = null;

        if (acceptEncoding.includes('br')) {
            content = await new Promise((resolve, reject) =>
                brotliCompress(file, (err, buf) => (err ? reject(err) : resolve(buf)))
            );
            contentEncoding = 'br';
        } else if (acceptEncoding.includes('gzip')) {
            content = await new Promise((resolve, reject) =>
                gzip(file, (err, buf) => (err ? reject(err) : resolve(buf)))
            );
            contentEncoding = 'gzip';
        }

        const headers: Record<string, string> = {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable'
        };

        if (contentEncoding) {
            headers['Content-Encoding'] = contentEncoding;
        }

        return new Response(content, { headers });
    } catch (err) {
        console.error(`error serving background: ${err}`);
        return new Response('not found', { status: 404 });
    }
};
