import { PUBLIC_BASE_URL } from '$env/static/public';
import { _allPosts, type PostData } from '../+layout.ts';

const entriesUrl = `${PUBLIC_BASE_URL}/entries`;

export const GET = async ({ }) => {
    return new Response(
        render(_allPosts),
        {
            headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store',
            }
        })
};

const render = (posts: PostData[]) => {
    return JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'gaze.systems posts feed',
        home_page_url: PUBLIC_BASE_URL,
        feed_url: `${entriesUrl}/_jsonfeed`,
        items: posts.map((post) => {
            return {
                id: post.path,
                url: `${entriesUrl}/${post.path}`,
                title: post.metadata.title,
                summary: post.metadata.excerpt,
                content_text: 'read the post on the website',
                date_published: new Date(post.metadata.date).toISOString(),
            }
        }),
    })
}