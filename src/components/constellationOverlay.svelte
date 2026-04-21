<script lang="ts">
	import { genDollcode } from '$lib/dollcode';

	interface Star {
		domain: string;
		x: number;
		y: number;
		r: number;
	}

	interface StarsData {
		width: number;
		height: number;
		stars: Star[];
		meta?: {
			timestamp: string;
			angleY: number;
			angleX: number;
			seed?: number;
		};
	}

	interface Props {
		stars: StarsData | null;
		isUIHidden: boolean;
	}

	let { stars, isUIHidden }: Props = $props();

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let tauShift = $derived.by(() => {
		if (stars?.meta?.seed === undefined) return 'UNKNOWN';
		const main = Math.abs(stars.meta.seed % 360);
		const sub = Math.abs((stars.meta.seed % 10000) / 10000);
		return (main + sub).toFixed(4);
	});

	let lambdaLock = $derived.by(() => {
		if (stars?.meta?.seed === undefined) return 'UNKNOWN';
		return ((stars.meta.seed * 1.618) % 100).toFixed(4);
	});
	let manifoldId = $derived.by(() => {
		if (stars?.meta?.seed === undefined) return 'UNKNOWN';
		const hex = stars.meta.seed.toString(16).toUpperCase();
		const chunks = hex.match(/.{1,5}/g)?.join('-') ?? hex;
		return chunks;
	});

	let scale = $derived.by(() => {
		if (!stars || containerWidth === 0 || containerHeight === 0) return 0;

		const imgRatio = stars.width / stars.height;
		const containerRatio = containerWidth / containerHeight;

		if (containerRatio > imgRatio) {
			return containerWidth / stars.width;
		} else {
			return containerHeight / stars.height;
		}
	});

	let offsetX = $derived.by(() => {
		if (!stars || scale === 0) return 0;
		return (containerWidth - stars.width * scale) / 2;
	});

	let offsetY = $derived.by(() => {
		if (!stars || scale === 0) return 0;
		return (containerHeight - stars.height * scale) / 2;
	});
</script>

<svelte:window bind:innerWidth={containerWidth} bind:innerHeight={containerHeight} />

{#if stars && scale > 0}
	<div class="fixed inset-0 pointer-events-none {isUIHidden ? 'z-[2000]' : 'z-0'} overflow-hidden">
		{#if stars.meta}
			<div class="absolute font-mono top-4 left-4 origin-top-left meta-text">
				<div>//DATE/{stars.meta.timestamp}</div>
				<div>&nbsp;/ASCENSION/{(stars.meta.angleY * (180 / Math.PI)).toFixed(4)}°</div>
				<div>&nbsp;/DECLINATION/{(stars.meta.angleX * (180 / Math.PI)).toFixed(4)}°/</div>
			</div>
			<div
				class="absolute font-mono top-4 left-1/2 -translate-x-1/2 origin-top meta-text text-center"
			>
				{genDollcode(
					new Date(stars.meta.timestamp).getTime() +
						stars.meta.angleY +
						stars.meta.angleX +
						(stars.meta.seed ?? 0)
				)}
			</div>
			<div class="absolute top-4 right-4 origin-top-right meta-text text-right">
				<div>//TAU SHIFT/{tauShift}°</div>
				<div>&nbsp;/LAMBDA LOCK/{lambdaLock}Gpc</div>
				<div>&nbsp;/MANIFOLD/{manifoldId}/</div>
			</div>
		{/if}
		{#each stars.stars as star}
			{@const screenX = star.x * scale + offsetX}
			{@const screenY = star.y * scale + offsetY}
			{@const radius = star.r * scale}

			<!-- only render if potentially visible -->
			{#if screenX > -50 && screenX < containerWidth + 50 && screenY > -50 && screenY < containerHeight + 50}
				<a
					href="https://{star.domain}"
					target="_blank"
					rel="noopener noreferrer"
					class="absolute pointer-events-auto group"
					style="
                        left: {screenX - radius}px;
                        top: {screenY - radius}px;
                        width: {radius * 2}px;
                        height: {radius * 2}px;
                    "
					title={star.domain}
				>
					<span class="sr-only">{star.domain}</span>
					<!-- Tooltip -->
					<div
						class="
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                        bg-black/80 text-white text-sm opacity-0 group-hover:opacity-100
                        transition-opacity whitespace-nowrap pointer-events-none
                        border border-white/20
                    "
					>
						{star.domain}
					</div>
				</a>
			{/if}
		{/each}
	</div>
{/if}

<style lang="postcss">
	.meta-text {
		@apply scale-50 text-white/70 drop-shadow-[0_2px_2px_rgba(0,0,0,1.0)] select-none z-10 pointer-events-none flex flex-col gap-0.5;
	}
</style>
