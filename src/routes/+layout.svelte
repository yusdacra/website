<script lang="ts">
	import getTitle from '$lib/getTitle';
	import NavButton from '../components/navButton.svelte';
	import '../styles/app.css';

	export let data;

	interface MenuItem {
		href: string;
		name: string;
		iconUri: string;
	}

	const menuItems: MenuItem[] = [
		{ href: '', name: 'home', iconUri: '/icons/home.png' },
		{ href: 'entries', name: 'entries', iconUri: '/icons/entries.png' },
		{ href: 'guestbook', name: 'guestbook', iconUri: '/icons/guestbook.png' },
		{ href: 'about', name: 'about', iconUri: '/icons/about.png' }
	];

	$: routeComponents = data.route.split('/');
	$: doAddPostItem = routeComponents.length > 3 && routeComponents[1] === 'entries';
	$: isRoute = (_route: string) => {
		if (doAddPostItem) {
			if (_route === 'entries') {
				return false;
			} else if (_route.startsWith('entries/')) {
				return true;
			}
		}
		return _route === routeComponents[1];
	};

	$: title = getTitle(data.route);

	const svgSquiggles = [[2], [3], [2], [3], [1]];
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:site_name" content="gaze.systems" />
	<meta property="og:url" content="https://gaze.systems/" />
	<meta property="og:image" content="https://gaze.systems/icons/gaze_website.png" />
</svelte:head>

<div
	class="
        app-grid-background motion-safe:app-grid-background-anim
        fixed -z-10 w-full [height:100%] top-0 left-0
    "
/>
<div
	class="
        app-grid-background-second-layer motion-safe:app-grid-background-second-layer-anim
        fixed -z-20 w-full [height:100%] top-0 left-0
    "
/>

<svg
	xmlns="http://www.w3.org/2000/svg"
	version="1.1"
	class="absolute -z-50"
	image-rendering="optimizeSpeed"
>
	<defs>
		{#each svgSquiggles as [scale], index}
			<filter id="squiggly-{index}">
				<feTurbulence
					id="turbulence"
					baseFrequency="0.02"
					numOctaves="3"
					result="noise"
					seed={index}
				/>
				<feDisplacementMap in="SourceGraphic" in2="noise" {scale} />
			</filter>
		{/each}
		<filter id="pixelate" color-interpolation-filters="linearRGB" x="0" y="0">
			<feFlood x="4" y="4" height="2" width="2" />
			<feComposite width="10" height="10" />
			<feTile result="a" />
			<feComposite in="SourceGraphic" in2="a" operator="in" />
			<feMorphology operator="dilate" radius="5" />
		</filter>
		<filter id="dither" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
			<feImage
				width="4"
				height="4"
				xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAASElEQVR42gXBgQAAIAxFwW8QwhBCCCGEIYQQQgghhBBCCEMYwutOkphzYmbsvdG9l9YaEYG7o1or5xxKKay1UGYyxuC9R++dD7yGJkTj6F0HAAAAAElFTkSuQmCC"
			/>
			<feTile />
			<feComposite operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" in="SourceGraphic" />
			<feComponentTransfer>
				<feFuncR type="discrete" tableValues="0 1" />
				<feFuncG type="discrete" tableValues="0 1" />
				<feFuncB type="discrete" tableValues="0 1" />
			</feComponentTransfer>
		</filter>
		<filter
			id="dither-red"
			color-interpolation-filters="sRGB"
			x="0"
			y="0"
			width="100%"
			height="100%"
		>
			<feFlood flood-color="#000000" flood-opacity="0.50" x="0%" y="0%" result="flood" />
			<feBlend mode="normal" x="0%" y="0%" in="SourceGraphic" in2="flood" result="blend1" />
			<feImage
				class="ditherImage"
				xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAA5ElEQVQYlQXBgQbCUABA0fdrk0ySSZJJkiRJMjOTTGZmkiRJZiYzyczMzGQmfdrtHPH7/TgcDuR5zna7pWka9vs9aZqyXq8R0+mU5/OJoihcLhfG4zFBENDtdjmdToj3+81yueTz+WCaJnEcM5/PKcsSXdcRsizjeR6j0YjH40Gr1cJxHAaDAbfbDVHXNbvdjiRJWK1WfL9fLMsiyzI2mw1CVVV836fT6XA8HplMJoRhSK/X43w+I6IoYjabURQFmqbxer1YLBZUVYVhGAhJkrBtm36/z/V6pd1u47ouw+GQ+/3OH4/Fn8FvF/NxAAAAAElFTkSuQmCC"
				x="0"
				y="0"
				width="4"
				height="4"
				crossOrigin="anonymous"
				result="image1"
			/>
			<feTile x="0" y="0" in="image1" result="tile" />
			<feBlend mode="overlay" x="0%" y="0%" in="blend1" in2="tile" result="blend2" />
			<feColorMatrix type="saturate" values="0" />
			<feComponentTransfer>
				<feFuncR type="discrete" tableValues="0 0" />
				<feFuncG type="discrete" tableValues="0 1" />
				<feFuncB type="discrete" tableValues="0 1" />
			</feComponentTransfer>
		</filter>
	</defs>
</svg>

<div class="md:h-[96vh] pb-[8vh] lg:px-[4vw] 2xl:px-[8vw] lg:pb-[5vh] lg:pt-[3.5vh] overflow-x-hidden [scrollbar-gutter:stable]">
	<slot />
</div>

<nav class="w-full min-h-[5vh] max-h-[6vh] fixed bottom-0 z-10 bg-ralsei-black overflow-hidden">
	<div
		class="
			max-w-full max-h-fit p-1
			border-ralsei-white border-8
			bg-gradient-to-r to-ralsei-pink-neon/30 from-ralsei-pink-regular/20 from-30%
		"
		style="border-style: ridge hidden hidden hidden;"
	>
		<div class="flex flex-row flex-nowrap gap-2 justify-start overflow-x-auto">
			{#each menuItems as item, menuIdx}
				{@const highlight = isRoute(item.href)}
				<NavButton {highlight} {...item} />
				{#if doAddPostItem && menuIdx == 1}
					<NavButton highlight name={routeComponents[2]} href={data.route.slice(1)} iconUri='/icons/entry.png'/>
				{/if}
			{/each}
			<div class="hidden md:block grow" />
			<div
				class="flex gap-3 px-1.5 text-nowrap align-middle items-center text-center place-content-center border-ralsei-white border-groove border-4"
			>
				<a title="previous site" class="hover:underline" href="https://xn--sr8hvo.ws/previous">⮜</a>
				<a class="hover:underline" href="https://xn--sr8hvo.ws">IndieWeb Webring</a>
				<a title="next site" class="hover:underline" href="https://xn--sr8hvo.ws/next">⮞</a>
			</div>
			<a class="align-middle" href="/entries/_rss">
				<img class="min-w-fit hover:opacity-60" src="/valid-rss.png" alt="rss feed" />
			</a>
		</div>
	</div>
</nav>
