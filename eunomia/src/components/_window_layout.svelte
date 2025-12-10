<script lang="ts">
	import Window from './window.svelte';
	import '../styles/app.css';

	interface Props {
		title: string;
		sticky: boolean;
		prose?: boolean;
		children?: import('svelte').Snippet;
	}

	let { title, sticky, prose = true, children }: Props = $props();
</script>

<Window {title} {sticky}>
	<div class={prose ? 'prose prose-ralsei leading-6 prose-ul:leading-5' : ''}>
		{@render children?.()}
	</div>
</Window>
