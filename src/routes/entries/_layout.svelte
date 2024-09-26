<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Window from '../../components/window.svelte';
	import '../../styles/app.css';
	import { page } from '$app/stores';

	export let title;
	export let date;
	export let excerpt;

	$: showMetadata = excerpt !== undefined && excerpt !== null;
</script>

<svelte:head>
	<meta property="og:description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
</svelte:head>

<article class="flex flex-wrap md:flex-nowrap gap-4 h-entry">
	<Window {title} iconUri="/icons/entry.png" entry>
		<div class="prose prose-ralsei max-w-[80ch] e-content">
			<slot />
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
