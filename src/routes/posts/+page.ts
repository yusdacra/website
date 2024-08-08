import convertDate from "$lib/convertDate";

export interface PostData {
	path: string,
	published: string,
	metadata: Record<string, string>,
}

export async function load({ params }) {
	const allPostFiles: Record<string, any> = import.meta.glob('./*/+page.md', {eager: true});
	const allPosts: PostData[] = Object.entries(allPostFiles).map(([path, post]) => {
		const postPath = path.slice(2, -8);
		return { metadata: post.metadata, path: postPath, published: convertDate(post.metadata.date) };
	});
	if (!allPosts.length) {
		return { status: 404 };
	}
	//console.log(allPosts);
	return { posts: allPosts };
}