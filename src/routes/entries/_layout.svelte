<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Window from '../../components/window.svelte';
	import '../../styles/app.css';
	import { page } from '$app/stores';

	interface Props {
		title: any;
		date: any;
		excerpt: any;
		children?: import('svelte').Snippet;
	}

	let {
		title,
		date,
		excerpt,
		children
	}: Props = $props();

	let showMetadata = $derived(excerpt !== undefined && excerpt !== null);
</script>

<svelte:head>
	<meta property="og:description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
</svelte:head>

<article class="mx-auto max-w-fit flex flex-wrap lg:flex-nowrap gap-4 h-entry">
	<Window {title} iconUri="/icons/entry.webp" entry>
		<div class="prose prose-ralsei max-w-[80ch] e-content">
			{@render children?.()}
		</div>
	</Window>
	{#if showMetadata}
		<Window title="metadata" sticky>
			<div class="prose prose-ralsei">
				<ul>
					<link class="u-url" href="{PUBLIC_BASE_URL}{$page.url.pathname}" />
					<li>author: <a rel="author" class="p-author h-card" href={PUBLIC_BASE_URL}>dusk</a></li>
					<li>published on: <time class="dt-published" datetime="{date} 00:00:00">{date}</time></li>
					<li class="max-w-80 text-wrap">
						excerpt: <div class="inline p-summary">{excerpt}</div>
					</li>
				</ul>
			</div>
		</Window>
	{/if}
</article>
