import images from './images.json'

export async function load({}) {
	return {
        images: images.map((id) => {
            return {
                og: `https://res.cloudinary.com/dgtwf7mar/image/upload/${id}`,
                id,
            }
        })
    };
}