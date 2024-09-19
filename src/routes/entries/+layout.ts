import convertDate from "$lib/convertDate";

export const prerender = true;

export interface PostData {
	path: string,
	published: string,
	metadata: Record<string, string>,
}

const allPostFiles: Record<string, any> = import.meta.glob('./*/+page.md', { eager: true });
const allPosts: PostData[] = Object.entries(allPostFiles).map(([path, post]) => {
	const postPath = path.slice(2, -8);
	return {
		metadata: post.metadata,
		path: postPath,
		published: convertDate(post.metadata.date)
	};
}).map((post) => {
	if (!("excerpt" in post.metadata)) {
		post.metadata.excerpt = ""
	}
	return post;
}).toSorted((post, opost) => {
	const date = new Date(post.metadata.date);
	const odate = new Date(opost.metadata.date);
	return odate.getTime() - date.getTime()
});
export const _allPosts = allPosts;

export async function load({}) {
	if (!allPosts.length) {
		return { status: 404 };
	}
	return { posts: allPosts };
}