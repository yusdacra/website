const images = import.meta.glob<any>(
    './images/*.webp',
    { query: { enhanced: true }, eager: true }
);

export function load() {
    const imgs =
        Object.values(images).map(module => {
            return module.default
        });
    return { images: imgs }
}