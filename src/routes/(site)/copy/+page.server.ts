export const load = async ({ url }) => {
	const text = url.searchParams.get('text') ?? '<nothing>';
	return { text };
};
