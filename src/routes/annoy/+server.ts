const index = await import('./index.html?raw');

export const GET = async () => {
	return new Response(index.default, { headers: { 'Content-Type': 'text/html' } });
};
