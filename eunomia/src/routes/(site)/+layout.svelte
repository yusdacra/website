<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import getTitle from '$lib/getTitle';
	import Eye from '$components/eye.svelte';
	import NavButton from '$components/navButton.svelte';
	import Pet, { localBounces, localDistanceTravelled } from '$components/pet.svelte';
	import Tooltip from '$components/tooltip.svelte';
	import '$styles/app.css';
	import ConstellationOverlay from '$components/constellationOverlay.svelte';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let isUIHidden = $state(false);

	interface MenuItem {
		href: string;
		name: string;
		iconUri: string;
	}

	const menuItems: MenuItem[] = [
		{ href: '', name: 'home', iconUri: '/icons/home.webp' },
		{ href: 'entries', name: 'entries', iconUri: '/icons/entries.webp' },
		{ href: 'guestbook', name: 'guestbook', iconUri: '/icons/guestbook.webp' },
		{ href: 'about', name: 'about', iconUri: '/icons/about.webp' }
	];

	let routeComponents = $derived($page.url.pathname.split('/'));
	let isEntryPage = $derived(routeComponents.length > 3 && routeComponents[1] === 'entries');
	let isResumePage = $derived(routeComponents[1] === 'resume');
	let isRoute = $derived((_route: string) => {
		if (isEntryPage) {
			if (_route === 'entries') {
				return false;
			} else if (_route.startsWith('entries/')) {
				return true;
			}
		}
		return _route === routeComponents[1];
	});

	let title = $derived(getTitle(data.route));

	const svgSquiggles = [[2], [3], [2], [3], [1]];

	// svelte-ignore non_reactive_update
	let eyePositions = null;
	if (eyePositions === null) {
		eyePositions = data.eyePositions;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:site_name" content="gaze.systems" />
	<meta property="og:url" content="https://gaze.systems/" />
	<meta property="og:image" content="https://gaze.systems/icons/gaze_website.webp" />
</svelte:head>

<div
	class="
        app-grid-background
        fixed -z-10 w-full [height:100%] top-0 left-0
    "
></div>

<ConstellationOverlay stars={data.stars} {isUIHidden} />

<svg
	xmlns="http://www.w3.org/2000/svg"
	version="1.1"
	class="absolute -z-50"
	image-rendering="optimizeSpeed"
>
	<defs>
		{#each svgSquiggles as [scale], index (index)}
			<filter id="squiggly-{index}">
				<feTurbulence
					id="turbulence"
					baseFrequency="0.03"
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

{#if !isResumePage && !isUIHidden}
	{#each data.lastVisitors as [id, visitor], index (id)}
		{@const pos = eyePositions.at(index)}
		{#if pos !== undefined}
			<Eye visits={visitor.visits} {id} top={pos[0]} left={pos[1]} />
		{/if}
	{/each}
{/if}

<div
	class="md:h-[96vh] pb-[8vh] lg:px-[1vw] 2xl:px-[2vw] lg:pb-[3vh] lg:pt-[1vh] overflow-x-hidden [scrollbar-gutter:stable] transition-opacity duration-500"
	class:opacity-0={isUIHidden}
	class:pointer-events-none={isUIHidden}
	aria-hidden={isUIHidden}
>
	{@render children?.()}
</div>

{#if !isResumePage}
	<div
		class="transition-opacity duration-500"
		class:opacity-0={isUIHidden}
		class:pointer-events-none={isUIHidden}
	>
		<Pet apiToken={data.apiToken} />
	</div>
{/if}

<nav
	class="w-full fixed bottom-0 z-[999] bg-ralsei-black overflow-visible transition-transform duration-500"
	class:translate-y-full={isUIHidden}
>
	<div
		class="
			max-w-full max-h-fit p-1 z-[999]
			border-ralsei-white border-8
			bg-gradient-to-r to-ralsei-pink-neon/30 from-ralsei-pink-regular/20 from-30%
		"
		style="border-style: ridge hidden hidden hidden;"
	>
		<div class="flex flex-row flex-nowrap gap-2 justify-start overflow-x-auto">
			{#each menuItems as item, menuIdx (item.href)}
				{@const highlight = isRoute(item.href)}
				<NavButton {highlight} {...item} />
				{#if isEntryPage && menuIdx === 1}
					<NavButton
						highlight
						name={routeComponents[2]}
						href={data.route.slice(1)}
						iconUri="/icons/entry.webp"
					/>
				{/if}
				{#if isResumePage && menuIdx === 2}
					<NavButton highlight name="resume" href="/resume.pdf" iconUri="/icons/about.webp" />
				{/if}
			{/each}
			<div class="hidden md:block grow"></div>
			<button
				class="navbox hover:animate-squiggle group relative"
				onclick={() => (isUIHidden = !isUIHidden)}
				title="hide ui"
			>
				hide ui
			</button>
			<div class="navbox">
				<a
					title="previous site"
					class="hover:underline"
					href="https://stellophiliac.github.io/roboring/gazesys/previous">⮜</a
				>
				<a class="hover:underline" href="https://stellophiliac.github.io/roboring">roboring</a>
				<a
					title="next site"
					class="hover:underline"
					href="https://stellophiliac.github.io/roboring/gazesys/next">⮞</a
				>
			</div>
			<div class="navbox">
				<a title="previous site" class="hover:underline" href="https://xn--sr8hvo.ws/previous">⮜</a>
				<a class="hover:underline" href="https://xn--sr8hvo.ws">indieweb</a>
				<a title="next site" class="hover:underline" href="https://xn--sr8hvo.ws/next">⮞</a>
			</div>
			{#if isRoute('entries') || isRoute('log')}
				<div class="navbox !gap-1">
					rss:
					<a class="align-middle hover:underline" href="/entries/_rss">posts</a>
					/
					<a class="align-middle hover:underline" href="/log/_rss">log</a>
				</div>
			{/if}
			<Tooltip>
				{#snippet tooltipContent()}
					<p>
						{#if data.ipv6}
							yay!!!!! good thing :3 you get a cookie! 🍪
						{:else}
							wow u're using ipv4.... you suck!!!!! <br />(or ur isp sucks sorgy)
						{/if}
					</p>
				{/snippet}
				<div class="navbox">
					<p>
						using <span
							class={data.ipv6
								? 'text-ralsei-green-light text-shadow-green'
								: 'text-red-500 text-shadow-red'}>{data.ipv6 ? 'ipv6' : 'ipv4'}</span
						>
					</p>
				</div>
			</Tooltip>
			<Tooltip>
				{#snippet tooltipContent()}
					<p class="font-monospace">
						{#snippet stat(text: string, value: number)}
							<nobr
								>{text}
								<span class="text-ralsei-green-light text-shadow-green"
									>{Math.round(value)
										.toString()
										.padStart(30 - (text.length + 1), '.')}</span
								></nobr
							>
						{/snippet}
						{@render stat('uniq recent visits', data.lastVisitors.size)}
						{@render stat('pet global bounce', data.petTotalBounce)}
						{@render stat('pet global travel', data.petTotalDistance)}
						{#if browser}
							{@render stat('pet local bounce', $localBounces)}
							{@render stat('pet local travel', $localDistanceTravelled)}
						{/if}
					</p>
				{/snippet}
				<div class="navbox">
					<p>
						<span class="text-ralsei-green-light text-shadow-green">{data.recentVisitCount}</span> recent
						clicks
					</p>
				</div>
			</Tooltip>
		</div>
	</div>
</nav>

{#if isUIHidden}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[1000]"
		onclick={() => {
			isUIHidden = false;
		}}
	></div>
{/if}

<style lang="postcss">
	@import '../../styles/app.css';

	.navbox {
		@apply flex gap-2 px-1 text-nowrap align-middle items-center text-center place-content-center border-ralsei-white border-4;
		border-style: groove;
	}

	.navbox a:hover {
		@apply animate-squiggle;
	}
</style>
