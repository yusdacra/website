import images from './images.json';

export async function load() {
	return {
		images: images.map((id) => {
			return {
				og: `https://res.cloudinary.com/dgtwf7mar/image/upload/v1/${id}`,
				thumb: `https://res.cloudinary.com/dgtwf7mar/image/upload/c_fill,w_480,h_480,g_center/c_limit,w_480/f_auto/q_auto/v1/${id}`
			};
		})
	};
}
