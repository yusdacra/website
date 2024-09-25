<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Window from '../../components/window.svelte';
	import '../../styles/app.css';
    import { page } from "$app/stores";

	export let title;
	export let date;
	export let excerpt;
</script>

<svelte:head>
	<meta property="og:description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
</svelte:head>

<article class="flex flex-wrap gap-x-4 pb-[8vh] h-entry">
	<Window {title} iconUri="/icons/entry.png">
		<div class="prose prose-ralsei max-w-[80ch] e-content">
			<slot />
		</div>
	</Window>
	<Window title="metadata">
		<div class="prose prose-ralsei">
			<ul>
                <link class="u-url" href="{PUBLIC_BASE_URL}{$page.url.pathname}">
                <link rel="author" class="p-author" href="{PUBLIC_BASE_URL}">
				<li>published on: <time class="dt-published" datetime="{date} 00:00:00">{date}</time></li>
				<li class="max-w-80 text-wrap">excerpt: <div class="inline p-summary">{excerpt}</div></li>
			</ul>
		</div>
	</Window>
</article>
