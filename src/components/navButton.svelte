<script lang="ts">
	export let highlight: boolean = false;
	export let name: string;
	export let href: string;
	export let iconUri: string;
</script>

<div
	class="
    p-0.5 pr-1.5 border-ralsei-white border-4
    {highlight
		? 'min-w-36 max-w-36 bg-gradient-to-l to-ralsei-pink-neon/30 from-ralsei-pink-regular/20 from-30% border-ridge motion-safe:animate-pulse hover:animate-none'
		: 'border-double hover:border-solid motion-safe:hover:animate-bounce'}
"
>
	<a
		class="
            flex gap-1 items-center justify-center
            {highlight
			? 'text-ralsei-pink-regular app-selected-route'
			: 'text-ralsei-green-light hover:underline'}
        "
		title={name}
		href="/{href}"
		data-sveltekit-preload-data="hover"
	>
		<img class="max-w-4" style="image-rendering: pixelated;" src={iconUri} alt={name} />
		<div class="font-monospace text-sm/3 overflow-hidden text-ellipsis text-nowrap">{name}</div>
	</a>
</div>
