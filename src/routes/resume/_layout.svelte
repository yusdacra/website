<script lang="ts">
	import Window from '../../components/window.svelte';
	import '../../styles/app.css';

	interface Props {
		title: string;
		children?: import('svelte').Snippet;
	}

	let { title, children }: Props = $props();
</script>

<Window {title} style="mx-auto">
	<div
		class="prose prose-ralsei leading-6 prose-ul:leading-5 prose-headings:leading-none prose-ul:px-4 max-w-[120ch]"
	>
		{@render children?.()}
	</div>
</Window>
