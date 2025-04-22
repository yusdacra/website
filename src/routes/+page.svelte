<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Note from '../components/note.svelte';
	import Window from '../components/window.svelte';
	import { renderDate, renderRelativeDate } from '$lib/dateFmt';
	import Tooltip from '../components/tooltip.svelte';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any;
	}

	const buttons = [
		{
			name: '250kb club',
			url: 'https://250kb.club/gaze-systems/',
			image: '/others/250kb.webp'
		},
		{
			name: 'candlelitsmiles',
			url: 'https://candlelitsmiles.neocities.org',
			image: 'https://candlelitsmiles.neocities.org/candlebuttonone.png'
		},
		{ name: 'julia', url: 'https://aph.nekoweb.org', image: '/others/aph.gif' },
		{ name: 'rain', url: 'https://slonk.ing/', image: '/others/slonk.gif' },
		{ name: 'dd', url: 'https://dd86k.space/about/', image: '/others/dd86k.gif' },
		{ name: 'cqql', url: 'https://cqql.site/', image: 'https://cqql.site/button/8831button.png' },
		{
			name: 'indieweb',
			url: 'https://indieweb.org/',
			image: 'https://indieweb.org/images/9/91/indieweb88x31-retro-gif.gif'
		},
		{
			name: 'nixos',
			url: 'https://nixos.org/',
			image: '/others/poweredbynixos.webp'
		},
		{
			name: 'godot',
			url: 'https://godotengine.org/',
			image: '/others/godot.gif'
		},
		{
			name: 'moonlight',
			url: 'https://moonlight-mod.github.io/',
			image: '/others/moonlightnow.gif'
		},
		{
			name: 'desktop!!',
			url: '/',
			image: '/others/desktopwebp.webp'
		},
		{
			name: 'defective by design',
			url: 'https://www.defectivebydesign.org/',
			image: '/others/dbd.gif'
		},
		{
			name: 'kill fascists',
			url: '/',
			image: '/others/killfascists.webp'
		},
		{
			name: 'it/its',
			url: '/',
			image: '/others/it.webp'
		},
		{
			name: 'not a person',
			url: '/',
			image: '/others/notaperson.webp'
		},
		{ name: 'skyrina', url: 'https://skyrina.dev/', image: '/others/skylar.gif' }
	];

	let { data }: Props = $props();
</script>

<div class="flex flex-col md:flex-row gap-2 md:gap-4 md:h-full h-card">
	<div class="flex flex-col gap-2 md:gap-6 ml-auto place-items-end">
		<Window title="status" iconUri="/icons/msn.webp" removePadding>
			{#if data.lastNote}
				<div class="m-1.5 flex flex-col font-monospace text-sm">
					<p
						class="prose prose-ralsei p-1 border-4 text-sm bg-ralsei-black"
						style="border-style: double double none double;"
						title={renderDate(data.lastNote.published)}
					>
						<a href="/entries">last log was…</a>
						published {renderRelativeDate(data.lastNote.published)}!
					</p>
					<div class="mt-0 p-1.5 border-4 border-double bg-ralsei-black min-w-full max-w-[60ch]">
						<Note note={data.lastNote} onlyContent />
					</div>
				</div>
			{/if}
			{#if data.lastActivity.length > 0}
				<div class="m-1.5 flex flex-col font-monospace text-sm">
					<p
						class="prose prose-ralsei p-1 border-4 text-sm bg-ralsei-black"
						style="border-style: double double none double;"
						title={renderDate(data.lastActivity[0].date)}
					>
						<a href="/">last git activity…</a>
						was {renderRelativeDate(data.lastActivity[0].date)}..
					</p>
					<div
						class="prose prose-ralsei mt-0 p-1.5 border-4 border-double bg-ralsei-black min-w-full max-w-[60ch]"
					>
						{#each data.lastActivity as activity, index}
							<div
								class="text-ralsei-green-light text-sm text-ellipsis text-nowrap overflow-hidden max-w-[60ch]"
								style="opacity: {1.0 - (index * 1.0) / data.lastActivity.length + index * 0.03};"
							>
								<span title={renderDate(activity.date)} class="text-[#f87c32]"
									>[{activity.source}]</span
								>
								<a href={activity.link} title={activity.description}>{activity.description}</a>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			{#if data.lastTrack}
				<div class="flex flex-row gap-0.5 m-1.5 border-4 border-double bg-ralsei-black">
					<!-- svelte-ignore a11y_missing_attribute -->
					{#if data.lastTrack.image}
						<img
							class="border-4 w-[4.5rem] h-[4.5rem]"
							style="border-style: none double none none;"
							src={data.lastTrack.image}
						/>
					{:else}
						<img
							class="border-4 w-[4.5rem] h-[4.5rem] p-2"
							style="border-style: none double none none; image-rendering: pixelated;"
							src="/icons/cd_audio.webp"
						/>
					{/if}
					<div class="flex flex-col max-w-[60ch] p-2">
						<p
							class="text-shadow-green text-ralsei-green-light text-sm text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							<span class="text-sm text-shadow-white text-ralsei-white"
								>{data.lastTrack.playing ? 'listening to' : 'listened to'}</span
							>
							<a
								title={data.lastTrack.name}
								href="https://www.last.fm/user/yusdacra"
								class="hover:underline motion-safe:hover:animate-squiggle">{data.lastTrack.name}</a
							>
						</p>
						<p
							class="text-shadow-pink text-ralsei-pink-regular text-sm text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							<span class="text-shadow-white text-ralsei-white">by</span>
							<span title={data.lastTrack.artist}>{data.lastTrack.artist}</span>
						</p>
						<p
							class="text-shadow-white text-ralsei-white text-xs text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							…{renderRelativeDate(data.lastTrack.when)}
						</p>
					</div>
				</div>
			{/if}
			{#if data.lastGame}
				<div class="flex flex-row m-1.5 border-4 border-double bg-ralsei-black">
					<!-- svelte-ignore a11y_missing_attribute -->
					<img
						class="border-4 w-[4.5rem] h-[4.5rem]"
						style="border-style: none double none none;"
						width="64"
						height="64"
						src={data.lastGame.icon}
					/>
					<div class="flex flex-col max-w-[60ch] p-2 gap-0.5 overflow-hidden">
						<p
							class="text-shadow-green text-ralsei-green-light text-sm text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							<span class="text-sm text-shadow-white text-ralsei-white"
								>{data.lastGame.playing ? 'playing' : 'played'}</span
							>
							<a title={data.lastGame.name} class="hover:underline" href={data.lastGame.link}
								>{data.lastGame.name}</a
							>
						</p>
						<p
							class="text-shadow-white text-ralsei-white text-xs text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							…{renderRelativeDate(data.lastGame.when)}
						</p>
						<!-- svelte-ignore a11y_missing_attribute -->
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
		<Window style="md:mr-2" title="cool buttons :>">
			<div class="max-w-[64ch] prose prose-ralsei prose-a:!animate-none prose-img:m-0 leading-snug">
				<div class="flex flex-row flex-wrap gap-3 place-items-start group">
					{#each buttons as { name, url, image }}
						<a title={name} href={url}
							><img
								class="relative transition-all group-hover:opacity-50 hover:!opacity-100 hover:!scale-[1.6] hover:z-10"
								style="image-rendering: pixelated !important;"
								src={image}
								alt={name}
							/></a
						>
					{/each}
				</div>

				<span class="text-sm">feel free to send this one stuff to add here ;3</span><br />
				<span class="text-xs italic">last updated on: 22-04-2025</span>
			</div>
		</Window>
	</div>
	<div class="flex flex-col gap-2 md:gap-3 mr-auto w-full md:w-fit place-items-start">
		<Window title="links!" iconUri="/icons/contact.webp">
			<div
				class="[width:40ch] prose prose-ralsei prose-ul:px-[0.9rem] prose-ul:leading-none prose-headings:leading-none"
			>
				<ul>
					<li>discord: yusdacra</li>
					<li>
						e-mail:
						<a class="u-email" href="mailto:90008@gaze.systems" rel="me">90008@gaze.systems</a>
					</li>
					<li>
						bluesky:
						<a class="u-url" href="https://bsky.app/profile/gaze.systems" rel="me">@gaze.systems</a>
					</li>
				</ul>
				<h4>development</h4>
				<ul>
					<li>
						github:
						<a class="u-url" href="https://github.com/yusdacra" rel="me">@yusdacra</a>
					</li>
					<li>
						forgejo:
						<a class="u-url" href="https://git.gaze.systems/90008" rel="me">@90008</a>
						(<a href="https://git.gaze.systems/90008/website">website repo</a>)
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
				<h4>services</h4>
				<ul>
					<li>
						<a href="https://pmart.gaze.systems">random project moon art</a>
					</li>
				</ul>
				<h4>88x31</h4>
				<div class="flex flex-row flex-wrap gap-1 prose-img:m-0">
					<img src="/88x31.gif" alt="88x31 banner" title="midnight AND sunrise! woaw" />
					<img
						src="/88x31_midnight.gif"
						alt="88x31 banner (midnight only)"
						title="it's midnight!"
					/>
					<img src="/88x31_sunrise.gif" alt="88x31 banner (sunrise only)" title="it's sunrise!" />
				</div>
			</div>
		</Window>
		<Window style="md:ml-2" title="readme?" iconUri="/icons/question.webp" removePadding>
			<div class="flex flex-col p-1.5 gap-1.5 prose prose-ralsei prose-img:m-0 leading-none">
				<div class="flex flex-row gap-3 mx-auto bg-ralsei-black/20 overflow-hidden">
					{#each data.banners as bannerNo, index}
						{@const hideIfMobile = index === data.banners.length - 1}
						<img
							width="150"
							height="20"
							title="banners from https://blinkies.cafe/ (refresh to get different ones! :3)"
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
					<Tooltip>
						{#snippet tooltipContent()}
							that's its angelsona ^^
						{/snippet}
						<div
							class="w-36 [padding:8px] place-content-center place-self-center bg-ralsei-black/20"
						>
							<img
								class="w-36 u-photo hover:invert transition-all [transition-duration:300ms]"
								src="/pfp-iojkqpwerojnasduijf.webp"
								alt="my angelsona"
							/>
						</div>
					</Tooltip>
					<div
						class="flex flex-row flex-grow place-content-center ml-1.5 [padding:8px] bg-ralsei-black/20"
					>
						<ul
							class="place-self-center m-0 mr-4 [padding-left:1em] sm:[padding-left:0.5em] leading-none marker:[content:'->'] [list-style-type:'->']"
						>
							<li class="[list-style-type:'->'] p-note">trying to do stuff</li>
							<li class="[list-style-type:'->'] p-note">
								<Tooltip
									x="translate-x-none"
									y="-translate-y-[40%]"
									targetX="group-hover:translate-x-[40%]"
									targetY="group-hover:-translate-y-[88%]"
								>
									{#snippet tooltipContent()}
										angelrobotpuppydollthing<br /><br />
										it/its, 3pp preferred
									{/snippet}
									is a <i>thing</i> (it/they)
								</Tooltip>
							</li>
							<li class="[list-style-type:'->']">
								<span class="p-category">software engineer</span>,
								<span class="p-category">indie game dev</span>
							</li>
							<li class="[list-style-type:'->']">
								in <span class="p-country-name">turkey</span>
								<i class="text-[0.5rem]">(get it out)</i>
							</li>
							<li class="[list-style-type:'->']">aka <span class="p-nickname">yusdacra</span></li>
						</ul>
					</div>
				</div>
				<div class="flex flex-row [padding:8px] bg-ralsei-black/20">
					<p class="leading-none m-0 text-sm">
						hi
						<img
							class="relative inline h-5 animate-squiggle pb-1"
							src="/wavey.gif"
							alt="wavey"
							title="says hi :33"
						/>
						<i
							>this is <a class="m-0 [padding:0px] p-name u-url u-uid" href={PUBLIC_BASE_URL}
								><span>dusk</span></a
							></i
						>
					</p>
					<div class="grow"></div>
					<a
						class="
							place-self-end [font-family:'Doll_Mono'] text-ralsei-pink-neon text-shadow-none hover:text-shadow-pink
							hover:!animate-none hover:!no-underline opacity-20 hover:opacity-100 transition-opacity [transition-duration:300ms]
						"
						title="dollcode? sure hope they do"
						href="https://dollcode.v01dlabs.sh/">▖▖▖▖▘▌▌▌▖▘▘</a
					>
				</div>
			</div>
		</Window>
		<Window title="notify me">
			<form
				class="flex flex-row gap-1 place-self-center"
				method="post"
				onsubmit={(event) => {
					event.preventDefault();
					const data = new FormData(event.currentTarget);
					try {
						fetch(`${PUBLIC_BASE_URL}/pushnotif/?content=${data.get('content')}`);
					} catch (err) {
						console.log(`failed to send notif: ${err}`);
					}
					event.currentTarget.reset();
				}}
			>
				<input
					type="text"
					class="entry text-lg p-1 m-0 bg-transparent resize-none text-shadow-white placeholder-shown:[text-shadow:none] border-none"
					name="content"
					placeholder="bother it now!!"
					maxlength="100"
					required
				/>
				<input
					type="submit"
					value="send!!"
					class="entry text-ralsei-green-light leading-none hover:underline motion-safe:hover:animate-squiggle p-1 z-50"
				/>
			</form>
		</Window>
	</div>
</div>

<style lang="postcss">
	.entry {
		@apply bg-ralsei-green-dark/70 border-ralsei-green-light/30 border-x-[4px] border-y-[5px];
		border-style: ridge;
	}
</style>
