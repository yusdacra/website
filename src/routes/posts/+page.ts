import convertDate from "$lib/convertDate";

export async function load({ params }) {
	const allPostFiles: Record<string, any> = import.meta.glob('./*/+page.md', {eager: true});
	const allPosts: any[] = Object.entries(allPostFiles).map(([path, post]) => {
		const postPath = path.slice(2, -8);
		return { ...post.metadata, path: postPath, published: convertDate(post.metadata.date) };
	});
	if (!allPosts.length) {
		return { status: 404 };
	}
	return { posts: allPosts };
}