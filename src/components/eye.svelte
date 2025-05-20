<script lang="ts">
	import { renderDate } from '$lib/dateFmt';
	import { genDollcode } from '$lib/dollcode';
	import Tooltip from './tooltip.svelte';

	interface Props {
		top: number;
		left: number;
		kind?: string;
		visits: number[];
		id: string;
	}

	let { top, left, kind = 'normal', visits, id }: Props = $props();

	const reverse = Math.random() > 0.35;
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

	randomizeLook();
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<Tooltip
	style="
        position: fixed;
        top: {top}vh;
    	left: {left}%;
    "
	y="translate-y-none"
	targetY="group-hover:translate-y-none"
	x="-translate-x-[20%]"
	targetX="group-hover:-translate-x-[20%]"
>
	{#snippet tooltipContent()}
		<p class="font-monospace" style="min-width: {id.length + 15}ch;">
			//observant/id={id}<br />
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/date="{renderDate(
				visits[0]
			)}"<br />
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/count={visits.length}/
		</p>
	{/snippet}
	<div
		class="group flex gap-4 items-center scale-[0.75]"
		style="
	opacity: {opacity};
	flex-direction: {reverse ? 'column-reverse' : 'column'};
	"
		onmouseover={() => {
			closed = true;
		}}
		onmouseleave={() => {
			closed = false;
		}}
	>
		<span class="eye-text !text-base">{genDollcode(visits.length)}</span>
		<!-- svelte-ignore a11y_missing_attribute -->
		<img class="w-24 eye-image" style="transform: rotate({rotation}rad);" {src} />
		<span class="eye-text">{genDollcode(visits[0])}</span>
	</div>
</Tooltip>

<style lang="postcss">
	.eye-text {
		@apply text-xs [font-family:Doll_Mono] opacity-30 group-hover:opacity-80;
	}
	.eye-image {
		@apply opacity-50 group-hover:opacity-100;
		image-rendering: pixelated !important;
		filter: drop-shadow(4px 4px 0 theme(colors.ralsei.green.light))
			drop-shadow(-4px -4px 0 theme(colors.ralsei.pink.neon));
	}
</style>
