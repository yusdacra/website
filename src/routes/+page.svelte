<script>
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Window from '../components/window.svelte';
</script>

<div class="flex flex-col md:flex-row gap-y-4 lg:gap-y-0 md:h-full h-card">
	<div class="flex flex-col gap-y-2 lg:gap-y-0">
		<Window title="readme?" iconUri="/icons/question.png">
			<div class="prose prose-ralsei prose-img:m-0 leading-6">
				<p>
					hi there
					<img
						class="relative inline h-6 animate-squiggle pb-1 pr-1"
						src="/wavey.gif"
						alt="wavey"
						title="hi :33"
					/>
					<i>i'm <a class="p-name u-url u-uid" href={PUBLIC_BASE_URL}>dusk</a>!</i>
				</p>
				<ul class="marker:[content:'->'] leading-none">
					<li class="p-note">trying to do stuff</li>
					<li><span class="p-category">software engineer</span>, <span class="p-category">indie game dev</span></li>
					<li><span class="p-gender-identity">genderfluid</span></li>
					<li>in <span class="p-country-name">turkey</span> <i class="text-[0.5rem] align-text-bottom">(get me out)</i></li>
					<li>aka <span class="p-nickname">yusdacra</span></li>
				</ul>
				<p>
					...and this is my personal spot on the web where i plan to put everything that i do on (<i class="text-sm">if i don't forget to</i> 👍)
				</p>
			</div>
		</Window>
		<div class="grow" />
		<Window title="latest stuff">
			<div class="prose prose-ralsei prose-img:m-0 leading-6">
				<p>
					worked on a game for a jam!! check it out at <a href="https://manonox.itch.io/fish-well"
						>it's itch.io page</a
					>!
				</p>
				<img
					src="https://img.itch.zone/aW1hZ2UvMjkxNjQzOC8xNzQ2MDY2Mi5wbmc=/original/%2BIb5Vf.png"
					alt="fish well gameplay screenshot"
				/>
			</div>
		</Window>
	</div>
	<div class="hidden md:block md:grow" />
	<Window title="contacts!" iconUri="/icons/contact.png">
		<div class="prose prose-ralsei leading-6">
			<ul>
				<li>discord: yusdacra</li>
				<li>
					e-mail:
					<a class="u-email" href="mailto:y.bera003.06@pm.me" rel="me">y.bera003.06@pm.me</a>
				</li>
			</ul>
			<h3>development</h3>
			<ul>
				<li>
					github:
					<a class="u-url" href="https://github.com/yusdacra" rel="me">@yusdacra</a>
				</li>
				<li>
					gitlab:
					<a href="https://gitlab.com/yusdacra">@yusdacra</a>
				</li>
				<li>
					my gitea:
					<a class="u-url" href="https://git.gaze.systems/dusk" rel="me">@dusk</a>
				</li>
			</ul>
			<h3>socials</h3>
			<ul>
				<li>
					bluesky:
					<a class="u-url" href="https://bsky.app/profile/gaze.systems" rel="me">@gaze.systems</a>
				</li>
				<li>
					misskey.art:
					<a href="https://misskey.art/@yusdacra">@yusdacra</a>
				</li>
			</ul>
		</div>
	</Window>
</div>

<div class="hidden motion-reduce:md:block absolute max-w-[40ch] bottom-[10vh] right-[8vw]">
	<Window title=":(" iconUri="/icons/warning.png">
		<div class="prose prose-ralsei leading-6">
			<p>
				you have <code>prefers-reduced-motion</code> enabled so i disabled (most of) the animations!
			</p>
			<p class="text-xs italic">they looked nice i think....</p>
		</div>
	</Window>
</div>
