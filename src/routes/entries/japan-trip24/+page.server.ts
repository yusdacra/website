import images from './images.json'

export async function load({}) {
	return {
        images: images.map((id) => {
            return `https://res.cloudinary.com/dgtwf7mar/image/upload/v1/${id}`
        })
    };
}