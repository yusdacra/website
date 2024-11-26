<script lang="ts">
	import { highestZIndex, isMobile } from '$lib/window.ts';
	import { draggable } from '@neodrag/svelte';

	export let title: string | undefined = undefined;
	export let iconUri: string = '';
	export let id: string = '';
	export let sticky: boolean = false;
	export let entry: boolean = false;
	export let removePadding: boolean = false;
	export let center: boolean = false;
	export let layered: boolean = false;
	export let style: string = "";
	export let tooltip: boolean = false;

	const scaleKeyframes = [
		"window-open",
		"window-open-vertical",
		"window-open-vertical",
		"window-open-horizontal",
		"window-open-horizontal",
		"window-open-move-up",
		"window-open-move-down",
		"window-open-move-left",
		"window-open-move-right",
	];
	$: chosenKeyframe = scaleKeyframes.at(Math.floor(Math.random() * scaleKeyframes.length))

	const isOnMobile = isMobile()
	const _draggable = isOnMobile ? () => {} : draggable;

	const focusWindow = (node: HTMLElement) => {
		$highestZIndex += 1
		node.style.zIndex = $highestZIndex.toString()
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	use:_draggable={{
		disabled: isOnMobile,
		applyUserSelectHack: true,
		handle: '.window-titlebar',
		onDragStart: (data) => {focusWindow(data.currentNode)},
	}}
	on:click={(data) => {focusWindow(data.currentTarget)}}
	class="
        relative {layered ? "col-[1] row-[1]" : ""} flex flex-col {sticky ? 'md:sticky md:-top-9' : ''} {center ? "mx-auto" : ""}
        max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-xl {tooltip ? "min-w-fit" : "min-w-[30ch] lg:min-w-[40ch]"} w-full md:w-fit [height:fit-content]
		bg-ralsei-black border-ralsei-white border-ridge {tooltip ? "border-[6px] border-t-[9px]" : "border-8 border-t-[12px]"}
		animate-{chosenKeyframe} drop-shadow-[24px_24px_24px_rgba(1,1,1,0.8)]
		{style}
    "
	{id}
>
	{#if title !== undefined}
		<div
			class="
				window-titlebar p-1 border-ralsei-white border-8
				bg-gradient-to-l from-ralsei-pink-neon to-ralsei-black to-75%
				{!isOnMobile ? "cursor-move" : ""} uppercase
			"
			style="border-style: hidden hidden ridge hidden;"
		>
			<div class="flex bg-opacity-100 pixelate-bg">
				<h1
					class="
						font-monospace text-xl text-ralsei-pink-regular
						grow justify-self-start self-center {entry ? 'p-name' : ''}
					"
				>
					{title}
				</h1>
				{#if iconUri !== ''}
					<img
						class="justify-self-end self-center max-h-7"
						style="image-rendering: pixelated;"
						src={iconUri}
						alt={iconUri}
					/>
				{/if}
			</div>
		</div>
	{/if}
	<div class="
		{removePadding ? "" : tooltip ? "p-1" : "p-2"} bg-gradient-to-tl
		to-ralsei-pink-neon/15 from-ralsei-pink-regular/20
	">
		<slot />
	</div>
</div>
