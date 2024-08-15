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
		{ href: 'about', name: 'about', iconUri: '/icons/about.png' }
	];

	const routeComponents = data.route.split('/');
	const doAddPostItem = routeComponents.length > 2 && routeComponents[1] === 'entries';
	const isRoute = (_route: string) => {
		if (doAddPostItem) {
			if (_route === 'entries') {
				return false;
			} else if (_route.startsWith('entries/')) {
				return true;
			}
		}
		return _route === routeComponents[routeComponents.length - 1];
	};

	if (doAddPostItem) {
		menuItems.splice(2, 0, {
			href: data.route.slice(1),
			name: routeComponents[2] + 'aaaaaaaa.md',
			iconUri: '/icons/entry.png'
		});
	}

	const title = getTitle(data.route);
</script>

<svelte:head>
    <title>{title}</title>
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="gaze.systems"/>
	<meta property="og:url" content="https://gaze.systems/"/>
	<meta property="og:type" content="website" />
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

<div class="lg:mx-[4vw] 2xl:mx-[8vw] lg:my-[4vh]"><slot /></div>

<nav class="w-full z-10 fixed bottom-0 bg-ralsei-black">
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
