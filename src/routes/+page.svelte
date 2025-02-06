<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Note from '../components/note.svelte';
	import Tooltip from '../components/tooltip.svelte';
	import Window from '../components/window.svelte';
	import LatestStuff from './lateststuff.md';

	export let data;

    const renderDate = (timestamp: number) => {
        return (new Date(timestamp)).toLocaleString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }
</script>

<div class="flex flex-col md:flex-row gap-y-2 lg:gap-y-0 md:h-full h-card">
	<div class="flex flex-col gap-y-2 lg:gap-y-0 mx-auto">
		<Window title="readme?" iconUri="/icons/question.png" removePadding>
			<div class="flex flex-col p-1.5 gap-1.5 prose prose-ralsei prose-img:m-0 leading-none">
				<div
					class="flex flex-row gap-3 mx-auto bg-ralsei-black bg-opacity-30 overflow-hidden"
				>
					{#each data.banners as bannerNo, index}
						{@const hideIfMobile = index === data.banners.length - 1}
						<img
							width="150"
							height="20"
							title="banners from https://blinkies.cafe/"
							alt="banner"
							class="
								{hideIfMobile ? 'hidden' : ''} sm:inline w-[150px] [height:20px]
								[image-rendering:pixelated_!important] shadow-ralsei-black shadow-[0px_4px_2px_0_rgb(0_0_0_/_0.05)]
							"
							src="/banners/{bannerNo}.gif"
						/>
					{/each}
				</div>
				<div class="flex flex-grow">
					<div
						class="w-36 [padding:8px] place-content-center place-self-center bg-ralsei-black bg-opacity-30"
					>
						<Tooltip x="-translate-x-[40%]" targetX="group-hover:-translate-x-[10%]">
							<svelte:fragment slot="tooltipContent"
								>character from unorthodox kitten</svelte:fragment
							>
							<img class="w-36 u-photo" src="/pfp.webp" alt="character from unorthodox kitten" />
						</Tooltip>
					</div>
					<div
						class="flex flex-row flex-grow place-content-center ml-1.5 [padding:8px] bg-ralsei-black bg-opacity-30"
					>
						<ul
							class="place-self-center m-0 mr-4 [padding-left:1em] sm:[padding-left:0.5em] leading-none marker:[content:'->'] [list-style-type:'->']"
						>
							<li class="[list-style-type:'->'] p-note">trying to do stuff</li>
							<li class="[list-style-type:'->'] p-note">is a thing that exists</li>
							<li class="[list-style-type:'->']">
								<span class="p-category">software engineer</span>,
								<span class="p-category">indie game dev</span>
							</li>
							<li class="[list-style-type:'->']">
								in <span class="p-country-name">turkey</span>
								<i class="text-[0.5rem]">(get me out)</i>
							</li>
							<li class="[list-style-type:'->']">aka <span class="p-nickname">yusdacra</span></li>
						</ul>
					</div>
				</div>
				<div class="flex flex-row [padding:8px] bg-ralsei-black bg-opacity-30">
					<p class="leading-none m-0 text-sm">
						hi there
						<img
							class="relative inline h-5 animate-squiggle pb-1"
							src="/wavey.gif"
							alt="wavey"
							title="hi :33"
						/>
						<i
							>i'm <a class="m-0 [padding:0px] p-name u-url u-uid" href={PUBLIC_BASE_URL}
								><span>dusk</span></a
							></i
						>
					</p>
					<div class="grow" />
					<a
						class="
							place-self-end [font-family:'Doll_Mono'] text-ralsei-pink-neon text-shadow-none hover:text-shadow-pink
							hover:!animate-none hover:!no-underline opacity-20 hover:opacity-100 transition-opacity [transition-duration:300ms]
						"
						href="https://dollcode.v01dlabs.sh/">▌▖▌▖‍▌▌▘▌‍▌▌▘▖‍▌▘▘▘‍</a
					>
				</div>
			</div>
		</Window>
		<Window title="latest stuff" style="mt-auto">
			<div class="prose prose-ralsei prose-img:m-0 leading-6">
				<LatestStuff />
			</div>
		</Window>
	</div>
	<div class="flex flex-col gap-y-2 lg:gap-y-0 mx-auto w-full md:w-fit place-items-end">
		<Window title="links!" iconUri="/icons/contact.png">
			<div class="prose prose-ralsei prose-ul:leading-[1.4rem] prose-headings:leading-none">
				<ul>
					<li>discord: yusdacra</li>
					<li>
						e-mail:
						<a class="u-email" href="mailto:y.bera003.06@pm.me" rel="me">y.bera003.06@pm.me</a>
					</li>
					<li>
						bluesky:
						<a class="u-url" href="https://bsky.app/profile/gaze.systems" rel="me">@gaze.systems</a>
					</li>
				</ul>
				<h3>development</h3>
				<ul>
					<li>
						github:
						<a class="u-url" href="https://github.com/yusdacra" rel="me">@yusdacra</a>
					</li>
					<li>
						my gitea:
						<a class="u-url" href="https://git.gaze.systems/dusk" rel="me">@dusk</a>
						(<a href="https://git.gaze.systems/gazesys/website">website repo</a>)
					</li>
					<li>
						gitlab:
						<a class="u-url" href="https://gitlab.com/yusdacra" rel="me">@yusdacra</a>
					</li>
					<li>
						itch.io:
						<a class="u-url" href="https://yusdacra.itch.io" rel="me">@yusdacra</a>
					</li>
				</ul>
				<h3>services</h3>
				<ul>
					<li>
						<a href="https://pmart.gaze.systems">random project moon art</a>
					</li>
				</ul>
			</div>
		</Window>
		<Window title="status" style="mt-auto" removePadding>
			{#if data.lastNote}
			<div class="m-1.5 flex flex-col font-monospace">
				<div
					class="prose prose-ralsei items-center p-1 border-4 text-sm font-bold bg-ralsei-black"
					style="border-style: double double none double;"
				>
					<a href="/entries">last log</a>
					<span class="border-4 pl-[1ch]" style="border-style: none none none double;">published on {renderDate(data.lastNote.published)}</span>
				</div>
				<div class="mt-0 p-1 border-4 border-double bg-ralsei-black min-w-full max-w-[40ch]">
					<Note note={data.lastNote} onlyContent/>
				</div>
			</div>
			{/if}
			{#if data.lastTrack}
			<div class="flex flex-row m-1.5 border-4 border-double bg-ralsei-black">
				<!-- svelte-ignore a11y-missing-attribute -->
				{#if data.lastTrack.image}
					<img
						class="border-4 w-16 h-16"
						style="border-style: none double none none;"
						width="64"
						height="64"
						src={data.lastTrack.image}
					/>
				{:else}
					<img
						class="border-4 w-16 h-16 p-2"
						style="border-style: none double none none; image-rendering: pixelated;"
						src="/icons/cd_audio.png"
					/>
				{/if}
				<div class="flex flex-col max-w-[40ch] p-2 overflow-hidden">
					<p
						class="text-shadow-green text-ralsei-green-light text-ellipsis text-nowrap overflow-hidden max-w-[30ch]"
					>
						<span class="text-sm text-shadow-white text-ralsei-white">listening to</span>
						<a
							title={data.lastTrack.name}
							href="https://www.last.fm/user/yusdacra"
							class="hover:underline">{data.lastTrack.name}</a
						>
					</p>
					<p
						class="text-shadow-pink text-ralsei-pink-regular text-sm text-ellipsis text-nowrap overflow-hidden max-w-[30ch]"
					>
						<span class="text-shadow-white text-ralsei-white">by</span>
						<span title={data.lastTrack.artist}>{data.lastTrack.artist}</span>
					</p>
				</div>
			</div>
			{/if}
			{#if data.lastGame}
			<div class="flex flex-row m-1.5 border-4 border-double bg-ralsei-black">
				<!-- svelte-ignore a11y-missing-attribute -->
				<img
					class="border-4 w-16 h-16"
					style="border-style: none double none none;"
					width="64"
					height="64"
					src={data.lastGame.icon}
				/>
				<div class="flex flex-col max-w-[40ch] p-2 gap-1 overflow-hidden">
					<p
						class="text-shadow-green text-ralsei-green-light text-ellipsis text-nowrap overflow-hidden max-w-[30ch]"
					>
						<span class="text-sm text-shadow-white text-ralsei-white">playing</span>
						<a title={data.lastGame.name} class="hover:underline" href={data.lastGame.link}
							>{data.lastGame.name}</a
						>
					</p>
					<!-- svelte-ignore a11y-missing-attribute -->
					<a
						href="https://steamcommunity.com/id/yusdacra"
						class="text-xs hover:underline text-shadow-green text-ralsei-green-light"
						><img class="inline w-4" src={data.lastGame.pfp} />
						<span class="align-middle">steam profile</span></a
					>
				</div>
			</div>
			{/if}
		</Window>
	</div>
</div>
