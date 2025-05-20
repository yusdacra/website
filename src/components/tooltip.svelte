<script lang="ts">
	import Window from './window.svelte';

	interface Props {
		x?: string;
		y?: string;
		targetY?: string;
		targetX?: string;
		tooltipContent?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		style?: string;
	}

	let {
		x = 'translate-x-none',
		y = 'translate-y-full',
		targetY = 'group-hover:-translate-y-[105%]',
		targetX = 'group-hover:-translate-x-2/3',
		tooltipContent,
		children,
		style = ''
	}: Props = $props();
</script>

<div class="group" {style}>
	<div
		class="z-10 absolute scale-0 transition-all [transition-timing-function:cubic-bezier(0.4,0,0.2,1.6)] [transition-duration:300ms] opacity-0 group-hover:scale-100 group-hover:opacity-100 {y} {x} {targetY} {targetX}"
	>
		<Window tooltip>
			{#if tooltipContent}{@render tooltipContent()}{:else}Hello world!{/if}
		</Window>
	</div>
	{@render children?.()}
</div>
