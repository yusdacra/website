<script lang="ts">
	import { highestZIndex, isMobile } from '$lib/window.ts';
	import { draggable } from '@neodrag/svelte';

	interface Props {
		title?: string;
		iconUri?: string;
		id?: string;
		sticky?: boolean;
		entry?: boolean;
		removePadding?: boolean;
		center?: boolean;
		layered?: boolean;
		style?: string;
		tooltip?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		title = undefined,
		iconUri = '',
		id = '',
		sticky = false,
		entry = false,
		removePadding = false,
		center = false,
		layered = false,
		style = '',
		tooltip = false,
		children
	}: Props = $props();

	const scaleKeyframes = [
		'window-open',
		'window-open-vertical',
		'window-open-vertical',
		'window-open-horizontal',
		'window-open-horizontal',
		'window-open-move-up',
		'window-open-move-down',
		'window-open-move-left',
		'window-open-move-right'
	];
	let chosenKeyframe = $derived(
		scaleKeyframes.at(Math.floor(Math.random() * scaleKeyframes.length))
	);

	const isOnMobile = isMobile();
	const _draggable = isOnMobile ? () => {} : draggable;

	const focusWindow = (node: HTMLElement) => {
		if (isOnMobile) return;
		$highestZIndex += 1;
		node.style.zIndex = $highestZIndex.toString();
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	use:_draggable={{
		disabled: isOnMobile,
		applyUserSelectHack: true,
		handle: '.window-titlebar',
		onDragStart: (data) => {
			focusWindow(data.currentNode);
		}
	}}
	onclick={(data) => {
		focusWindow(data.currentTarget);
	}}
	class="
        relative flex flex-col w-full md:w-fit [height:fit-content]
        {center ? 'mx-auto' : ''}
        {layered ? 'col-[1] row-[1]' : ''}
        {sticky ? 'md:sticky md:-top-9' : ''}
        max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-xl
        {tooltip ? 'min-w-fit' : ''}
		bg-ralsei-black border-ralsei-white border-ridge
		{tooltip ? 'border-[6px] border-t-[9px]' : 'border-[7px] border-t-[12px]'}
		{isOnMobile || tooltip ? '' : 'hover:-translate-x-1 hover:translate-y-1'}
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
				{!isOnMobile ? 'cursor-move' : ''}
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
	<div
		class="
		{removePadding ? '' : tooltip ? 'p-1' : 'p-2'} bg-gradient-to-tl
		to-ralsei-pink-neon/15 from-ralsei-pink-regular/20
	"
	>
		{@render children?.()}
	</div>
</div>
