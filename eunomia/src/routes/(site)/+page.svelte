<script lang="ts">
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Note from '$components/note.svelte';
	import Window from '$components/window.svelte';
	import { renderDate, renderRelativeDate } from '$lib/dateFmt';
	import Tooltip from '$components/tooltip.svelte';
	import '$styles/main.css';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any;
	}

	const trimStr = (str: string, maxLength: number = 32): string => {
		if (str.length <= maxLength) return str;
		return str.slice(0, maxLength - 3) + '…';
	};

	const wallets: Record<string, string> = {
		btc: 'bc1q7dgsgxj8jua50d3xjgg28v2c6uhpgpe79vr4ra',
		eth: '0xF5dC63d340556925Ae2a64e5F0c19e3c2471139F',
		xmr: '45TJMbHrdyTSPywExKbzL51uuJZGTrDzrLidFufeGU4LA13Un92LTZeWhy2ePCcVaZ64KJdUjSZgMPM9jXfjJcxEQJ8szvw'
	};

	const buttons = [
		{
			name: '250kb club',
			url: 'https://250kb.club/gaze-systems/',
			image: '/others/250kb.webp'
		},
		{
			name: 'june',
			url: 'https://girlboss.ceo',
			image: 'https://x86.pet/~strawberry/june_88x31.png'
		},
		{ name: 'dd', url: 'https://dd86k.space/about/', image: '/others/dd86k.gif' },
		{ name: 'drew', url: 'https://drewsh.com/', image: '/others/drewsh.gif' },
		{
			name: 'deniz',
			url: 'https://deniz.blue',
			image: 'https://deniz.blue/assets/88x31v0.png'
		},
		{ name: 'rain', url: 'https://slonk.ing/', image: '/others/slonk.gif' },
		{
			name: 'blooym',
			url: 'https://blooym.dev/',
			image: 'https://blooym.dev/files/88x31/blooym_mori.webp'
		},
		{
			name: 'elysia',
			url: 'https://ely.pub.moe/',
			image: 'https://ely.pub.moe/storage/icons/buttons/elysia.png'
		},
		{
			name: 'vern',
			url: 'https://vern.cc/',
			image: 'https://cobra.vern.cc/media/buttons/vern.webp'
		},
		{
			name: "31A05B9C's random site",
			url: 'https://www.31a05b.net/',
			image: 'https://www.31a05b.net/a/8831/31a05b.png'
		},
		{
			name: 'candlelitsmiles',
			url: 'https://candlelitsmiles.neocities.org',
			image: 'https://candlelitsmiles.neocities.org/candlebuttonone.png'
		},
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
		}
	];

	let { data }: Props = $props();
</script>

<div class="flex flex-col-reverse md:flex-row gap-2 md:gap-4 md:h-full h-card">
	<div class="flex flex-col gap-2 md:gap-6 md:ml-auto place-items-end">
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
					<div
						class="mt-0 p-1.5 border-4 border-double bg-ralsei-black min-w-full max-w-[60ch]"
					>
						<Note rootNote={data.lastNote} onlyContent />
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
						{#each data.lastActivity as activity, index (index)}
							<div
								class="text-ralsei-green-light text-sm text-ellipsis text-nowrap overflow-hidden max-w-[60ch]"
								style="opacity: {1.0 -
									(index * 1.0) / data.lastActivity.length +
									index * 0.03};"
							>
								<span title={renderDate(activity.date)} class="text-[#f87c32]"
									>[{activity.source}]</span
								>
								<a href={activity.link} title={activity.description}
									>{activity.description}</a
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			{#if data.lastTrack}
				{@const images = data.lastTrack.images}
				{@const initialUrl = images.mb ?? images.yt}
				<div class="flex flex-row gap-0.5 m-1.5 border-4 border-double bg-ralsei-black">
					<!-- svelte-ignore a11y_missing_attribute -->
					<img
						class="border-4 w-[4.5rem] h-[4.5rem] {initialUrl ? 'object-cover' : 'p-2'}"
						style="border-style: none double none none; {initialUrl
							? ''
							: 'image-rendering: pixelated;'}"
						src={initialUrl ?? '/icons/cd_audio.webp'}
						title={data.lastTrack.album}
						onerror={(e) => {
							const img = e.currentTarget as HTMLImageElement;
							if (images.mb && img.src === images.mb && images.yt)
								img.src = images.yt;
							else {
								img.src = '/icons/cd_audio.webp';
								img.classList.remove('object-cover');
								img.classList.add('p-2');
								img.style.imageRendering = 'pixelated';
							}
						}}
					/>
					<div class="flex flex-col max-w-[60ch] p-2 text-ellipsis overflow-hidden">
						<p
							class="text-shadow-green text-ralsei-green-light text-sm text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							<span class="text-sm text-shadow-white text-ralsei-white"
								>{data.lastTrack.status === 'playing'
									? 'listening to'
									: 'listened to'}</span
							>
							<a
								title={data.lastTrack.name}
								href={data.lastTrack.link ??
									'https://tealfm-slice.wisp.place/profile/ptr.pet/scrobbles'}
								class="hover:underline motion-safe:hover:animate-squiggle"
								>{data.lastTrack.name}</a
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
							<a
								title={data.lastGame.name}
								class="hover:underline"
								href={data.lastGame.link}>{data.lastGame.name}</a
							>
						</p>
						<p
							class="text-shadow-white text-ralsei-white text-xs text-ellipsis text-nowrap overflow-hidden max-w-[50ch]"
						>
							…{renderRelativeDate(data.lastGame.when)}
						</p>
						<!-- svelte-ignore a11y_missing_attribute -->
						<a
							href="https://steamcommunity.com/id/090008"
							class="text-xs hover:underline text-shadow-green text-ralsei-green-light"
							><img class="inline w-4" src={data.lastGame.pfp} />
							<span class="align-middle">steam profile</span></a
						>
					</div>
				</div>
			{/if}
		</Window>
		<Window style="md:mr-2" title="cool buttons :>">
			<a class="fixed" title="skyrina" href="https://skyrina.dev/"
				><img
					class="-translate-y-[8.85rem] z-20"
					style="image-rendering: pixelated !important;"
					src="/others/skylar.gif"
					alt="skyrina"
				/></a
			>
			<div
				class="max-w-[488px] prose prose-ralsei prose-a:!animate-none prose-img:m-0 leading-none"
			>
				<div class="flex flex-row flex-wrap gap-3 place-items-start group">
					{#each buttons as { name, url, image } (image)}
						<a title={name} href={url}
							><img
								class="relative transition-all group-hover:opacity-50 hover:!opacity-100 hover:!scale-[2.0] hover:z-10"
								style="image-rendering: pixelated !important;"
								src={image}
								alt={name}
							/></a
						>
					{/each}
				</div>

				<br />feel free to send this one stuff to add here ;3
			</div>
		</Window>
	</div>
	<div class="flex flex-col gap-2 md:gap-3 md:mr-auto w-full md:w-fit place-items-start">
		<Window style="md:ml-2" title="readme?" iconUri="/icons/question.webp" removePadding>
			<div class="flex flex-col p-1.5 gap-1.5 prose prose-ralsei prose-img:m-0 leading-none">
				<div class="flex flex-row gap-3 mx-auto bg-ralsei-black/20 overflow-hidden">
					{#each data.banners as bannerNo, index (bannerNo)}
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
									is a <i class="motion-safe:hover:animate-squiggle">thing</i> (it/they)
								</Tooltip>
							</li>
							<li class="[list-style-type:'->']">
								<span class="p-category">software engineer</span>,
								<span class="p-category">indie game dev</span>
							</li>
							<li class="[list-style-type:'->']">
								for resume, click <a href="/resume.pdf">here</a>
							</li>
							<li class="[list-style-type:'->']">
								in <span class="p-country-name">turkey</span>
								<i class="text-[0.5rem]">(get it out)</i>
							</li>
						</ul>
					</div>
				</div>
				<div class="flex flex-row [padding:8px] bg-ralsei-black/20">
					<p class="leading-none m-0">
						<img
							class="relative inline h-5 animate-squiggle pb-1"
							src="/wavey.gif"
							alt="wavey"
							title="says hi :33"
						/>
						this is
						<a class="m-0 [padding:0px] p-name u-url u-uid" href={PUBLIC_BASE_URL}
							><span>{Math.random() > 0.8 ? 'dusk' : 'dawn'}</span></a
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
		<Window title="notify this one">
			<form
				class="flex flex-row gap-1 place-self-center"
				method="post"
				onsubmit={(event) => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					try {
						fetch(
							`${PUBLIC_BASE_URL}/_api/pushnotif?content=${formData.get('content')}&_token=${data.apiToken}`
						);
					} catch (err) {
						console.log(`failed to send notif: ${err}`);
					}
					event.currentTarget.reset();
				}}
			>
				<input
					type="text"
					class="entry w-full p-1 m-0 bg-transparent resize-none text-shadow-white placeholder-shown:[text-shadow:none] border-none"
					name="content"
					placeholder="bother it now!!"
					maxlength="100"
					required
				/>
				<input type="hidden" name="_token" value={data.apiToken} />
				<input
					type="submit"
					value="send!!"
					class="entry text-ralsei-green-light leading-none hover:underline motion-safe:hover:animate-squiggle p-1 z-50"
				/>
			</form>
		</Window>
		<Window title="links!" iconUri="/icons/contact.webp">
			<div
				class="prose prose-ralsei prose-ul:px-[1rem] prose-ul:mt-2 prose-ul:leading-none prose-headings:leading-none"
			>
				<ul>
					<li>discord: 90.008</li>
					<li>
						e-mail:
						<a class="u-email" href="mailto:90008@gaze.systems" rel="me"
							>90008@gaze.systems</a
						>
					</li>
					<li>
						bluesky:
						<a
							class="u-url"
							href="https://bsky.app/profile/did:plc:dfl62fgb7wtjj3fcbb72naae"
							rel="me">@ptr.pet</a
						>
					</li>
				</ul>
				<details open>
					<summary>development</summary>
					<ul>
						<li>
							github:
							<a class="u-url" href="https://github.com/90-008" rel="me">@90-008</a>
						</li>
						<li>
							tangled:
							<a
								class="u-url"
								href="https://tangled.org/did:plc:dfl62fgb7wtjj3fcbb72naae"
								rel="me">@ptr.pet</a
							>
						</li>
						<li>
							itch.io:
							<a class="u-url" href="https://90008.itch.io" rel="me">@90008</a>
						</li>
					</ul>
				</details>
				<details class="donate" open>
					<summary>donate</summary>
					<ul>
						{#each ['eth', 'btc', 'xmr'] as coin (coin)}
							<li>
								<span
									>{coin}:
									<a href="/copy?text={wallets[coin]}">{trimStr(wallets[coin])}</a
									></span
								>
							</li>
						{/each}
						<li>
							<span
								><a href="https://patreon.com/_90008" rel="me">patreon</a>,
								<a href="https://github.com/sponsors/90-008" rel="me"
									>github sponsors</a
								></span
							>
						</li>
					</ul>
				</details>
				<details open>
					<summary>88x31</summary>
					<div class="mt-2 flex flex-row flex-wrap gap-1 prose-img:m-0">
						<img
							src="/88x31.gif"
							alt="88x31 banner"
							title="midnight AND sunrise! woaw"
						/>
						<img
							src="/88x31_midnight.gif"
							alt="88x31 banner (midnight only)"
							title="it's midnight!"
						/>
						<img
							src="/88x31_sunrise.gif"
							alt="88x31 banner (sunrise only)"
							title="it's sunrise!"
						/>
					</div>
				</details>
			</div>
		</Window>
	</div>
</div>
