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

	let menuItems: MenuItem[] = [
		{ href: '', name: 'home', iconUri: '/icons/home.png' },
		{ href: 'entries', name: 'entries', iconUri: '/icons/entries.png' },
		{ href: 'guestbook', name: 'guestbook', iconUri: '/icons/guestbook.png' },
		{ href: 'about', name: 'about', iconUri: '/icons/about.png' }
	];

	const routeComponents = data.route.split('/');
	const doAddPostItem = routeComponents.length > 3 && routeComponents[1] === 'entries';
	const isRoute = (_route: string) => {
		if (doAddPostItem) {
			if (_route === 'entries') {
				return false;
			} else if (_route.startsWith('entries/')) {
				return true;
			}
		}
		return _route === routeComponents[1];
	};

	if (doAddPostItem) {
		menuItems.splice(2, 0, {
			href: data.route.slice(1),
			name: routeComponents[2],
			iconUri: '/icons/entry.png'
		});
	}

	const title = getTitle(data.route);
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="gaze.systems" />
	<meta property="og:url" content="https://gaze.systems/" />
	<meta property="og:image" content="https://gaze.systems/icons/gaze_website.png" />
</svelte:head>

<div
	class="
        app-grid-background motion-safe:app-grid-background-anim
        fixed -z-10 w-full h-full top-0 left-0
    "
/>
<div
	class="
        app-grid-background-second-layer motion-safe:app-grid-background-second-layer-anim
        fixed -z-20 w-full h-full top-0 left-0
    "
/>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="absolute -z-50">
	<defs>
		<filter id="squiggly-0">
			<feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="0" />
			<feDisplacementMap id="displacement" in="SourceGraphic" in2="noise" scale="2" />
		</filter>
		<filter id="squiggly-1">
			<feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
			<feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
		</filter>
		<filter id="squiggly-2">
			<feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
			<feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
		</filter>
		<filter id="squiggly-3">
			<feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="3" />
			<feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
		</filter>
		<filter id="squiggly-4">
			<feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="4" />
			<feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
		</filter>
	</defs>
</svg>

<div class="md:h-[96vh] pb-[7vh] lg:px-[4vw] 2xl:px-[8vw] lg:py-[4vh]">
	<slot />
</div>

<nav class="w-full max-h-[6vh] fixed bottom-0 z-10 bg-ralsei-black">
	<div
		class="
			max-w-full max-h-fit p-1 overflow-auto
			grid grid-flow-col grid-rows-1 gap-2 justify-start
			border-ralsei-white border-8
			bg-gradient-to-r to-ralsei-pink-neon/30 from-ralsei-pink-regular/20 from-30%
		"
		style="border-style: ridge hidden hidden hidden;"
	>
		{#each menuItems as item}
			{@const highlight = isRoute(item.href)}
			<NavButton {highlight} {...item} />
		{/each}
	</div>
</nav>