<script lang="ts">
	import { genDollcode } from '$lib/dollcode';

	interface Props {
		top: number;
		left: number;
		kind?: string;
		visits: number[];
		id: string;
	}

	let { top, left, kind = 'normal', visits }: Props = $props();

	let rotation = $state((Math.random() - 0.5) * 0.4);
	const opacity = Math.min(Math.random() * 0.3 + 0.4, 0.7);

	let closed = $state(false);
	let look = $state('forward');
	const looks = ['left', 'forward', 'right'];
	const pickLook = $derived(() => {
		const pickable = looks.filter((l) => {
			return l !== look;
		});
		return pickable.at(Math.floor(Math.random() * pickable.length)) ?? 'forward';
	});
	const randomizeLook = () => {
		look = pickLook();
		rotation = (Math.random() - 0.5) * 0.4;
		setTimeout(randomizeLook, 2000 + Math.random() * 6000);
	};

	let src = $derived(closed ? `/eyes/closed.webp` : `/eyes/${kind}_${look}.webp`);

	// generate dollcode based on time, but mod by 3 hours
	const timeDollcode = $derived(genDollcode((visits[0] / 1000) % (60 * 60 * 24)));
	const visitsDollcode = $derived(genDollcode(visits.length));

	randomizeLook();
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group flex gap-4 items-center scale-[0.75]"
	style="
        position: fixed;
        top: {top}vh;
       	left: {left}%;
    	opacity: {opacity};
    	flex-direction: column-reverse;
	"
	onmouseover={() => {
		closed = true;
	}}
	onmouseleave={() => {
		closed = false;
	}}
>
	<span class="eye-text !text-base">{visitsDollcode}</span>
	<!-- svelte-ignore a11y_missing_attribute -->
	<img class="w-24 eye-image" style="transform: rotate({rotation}rad);" {src} />
	<span class="eye-text">{timeDollcode}</span>
</div>

<style lang="postcss">
	.eye-text {
		@apply text-sm [font-family:Doll_Mono] opacity-30 group-hover:opacity-80;
	}
	.eye-image {
		@apply opacity-50 group-hover:opacity-100;
		image-rendering: pixelated !important;
		filter: drop-shadow(4px 4px 0 theme(colors.ralsei.green.light))
			drop-shadow(-4px -4px 0 theme(colors.ralsei.pink.neon));
	}
</style>
