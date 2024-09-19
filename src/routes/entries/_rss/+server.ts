import { PUBLIC_BASE_URL } from '$env/static/public';
import { _allPosts, type PostData } from '../+layout.ts';

const entriesUrl = `${PUBLIC_BASE_URL}/entries`;

export const GET = async ({ }) => {
      return new Response(render(_allPosts), {
            headers: {
                  'content-type': 'application/xml',
                  'cache-control': 'no-cache',
            }
      })
};

const render = (posts: PostData[]) => `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
  <atom:link href="${entriesUrl}/_rss" rel="self" type="application/rss+xml" />
  <title>gaze.systems</title>
  <link>${PUBLIC_BASE_URL}</link>
  <description>dusk's personal website</description>
  ${posts.map((post) => `<item>
  <guid>${entriesUrl}/${post.path}</guid>
  <title>${post.metadata.title}</title>
  <link>${entriesUrl}/${post.path}</link>
  <description>${post.metadata.excerpt}</description>
  <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
  </item>`).join('')}
  </channel>
  </rss>
  `;