<script>
	import Window from '../components/window.svelte';
</script>

<div class="flex flex-col md:flex-row gap-y-4 lg:gap-y-0 md:h-full">
	<div class="flex flex-col gap-y-2 lg:gap-y-0">
		<Window title="readme?" iconUri='/icons/question.png'>
			<div class="prose prose-ralsei prose-img:m-0 leading-6">
				<p>hi there <img class="inline h-6 animate-squiggle" src="/wavey.gif" alt="wavey" title="hi :33" /></p>
				<p>
					i'm dusk! and this is my personal spot where i plan to put everything that i do on (<i>if i don't forget to...</i>)
				</p>
				<p>not much else to say, hopefully will add more text here one day :></p>
				<p>website very much in progress still !!!</p>
			</div>
		</Window>
		<div class="grow"/>
		<Window title="latest stuff">
			<div class="prose prose-ralsei prose-img:m-0 leading-6">
				<p>worked on a game for a jam!! check it out at <a href="https://manonox.itch.io/fish-well">it's itch.io page</a>!</p>
				<img src="https://img.itch.zone/aW1hZ2UvMjkxNjQzOC8xNzQ2MDY2Mi5wbmc=/original/%2BIb5Vf.png" alt="fish well gameplay screenshot">
			</div>
		</Window>
	</div>
	<div class="hidden md:block md:grow" />
	<Window title="contacts!" iconUri='/icons/contact.png'>
		<div class="prose prose-ralsei leading-6">
			<ul>
				<li>discord: yusdacra</li>
				<li>
					e-mail:
					<a href="mailto:y.bera003.06@pm.me" rel="me">y.bera003.06@pm.me</a>
				</li>
			</ul>
			<h3>development</h3>
			<ul>
				<li>
					github:
					<a href="https://github.com/yusdacra" rel="me">@yusdacra</a>
				</li>
				<li>
					gitlab:
					<a href="https://gitlab.com/yusdacra">@yusdacra</a>
				</li>
				<li>
					my gitea:
					<a href="https://git.gaze.systems/dusk">@dusk</a>
				</li>
			</ul>
			<h3>socials</h3>
			<ul>
				<li>
					bluesky:
					<a href="https://bsky.app/profile/gaze.systems">@gaze.systems</a>
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
	<Window title=":(" iconUri='/icons/warning.png'>
		<div class="prose prose-ralsei leading-6">
			<p>you have <code>prefers-reduced-motion</code> enabled so i disabled (most of) the animations!</p>
			<p class="text-xs italic">they looked nice i think....</p>
		</div>
	</Window>
</div>
