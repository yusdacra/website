<script>
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import Window from '../components/window.svelte';
</script>

<div class="flex flex-col md:flex-row gap-y-4 lg:gap-y-0 md:h-full h-card">
	<div class="flex flex-col gap-y-2 lg:gap-y-0">
		<Window title="readme?" iconUri="/icons/question.png">
			<div class="flex flex-col prose prose-ralsei prose-img:m-0 leading-none">
				<div class="flex flex-grow">
					<img
						class="mt-1 ml-1 w-36 [height:9rem] u-photo"
						src="/pfp.png"
						alt="character from q.u.q."
						title="character from q.u.q. (good vn go read it NOW)"
					/>
					<ul
						class="place-self-center m-0 leading-none marker:[content:'->'] [list-style-type:'->']"
					>
						<li class="[list-style-type:'->'] p-note">trying to do stuff</li>
						<li class="[list-style-type:'->']">
							<span class="p-category">software engineer</span>,
							<span class="p-category">indie game dev</span>
						</li>
						<li class="[list-style-type:'->']">
							<span class="p-gender-identity">genderfluid</span>
						</li>
						<li class="[list-style-type:'->']">
							in <span class="p-country-name">turkey</span>
							<i class="text-[0.5rem]">(get me out)</i>
						</li>
						<li class="[list-style-type:'->']">aka <span class="p-nickname">yusdacra</span></li>
					</ul>
				</div>
				<p class="leading-none m-0 mt-3 text-sm">
					hi there
					<img
						class="relative inline h-5 animate-squiggle pb-1 pr-1"
						src="/wavey.gif"
						alt="wavey"
						title="hi :33"
					/>
					<i>i'm <a class="m-0 [padding:0px] p-name u-url u-uid" href={PUBLIC_BASE_URL}>dusk</a>!</i
					>
				</p>
			</div>
		</Window>
		<div class="mt-auto">
			<Window title="latest stuff">
				<div class="prose prose-ralsei prose-img:m-0 leading-6">
					<p>
						worked on a game for a jam!! check it out at <a href="https://manonox.itch.io/fish-well"
							>it's itch.io page</a
						>!
					</p>
					<img
						class="md:max-w-[35rem]"
						src="https://img.itch.zone/aW1hZ2UvMjkxNjQzOC8xNzQ2MDY2Mi5wbmc=/original/%2BIb5Vf.png"
						alt="fish well gameplay screenshot"
					/>
				</div>
			</Window>
		</div>
	</div>
	<div class="hidden md:block md:grow" />
	<div class="flex flex-col gap-y-2 lg:gap-y-0">
		<div class="md:ml-auto">
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
							<a class="u-url" href="https://gitlab.com/yusdacra" rel="me">@yusdacra</a>
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
							<a class="u-url" href="https://misskey.art/@yusdacra" rel="me">@yusdacra</a>
						</li>
					</ul>
				</div>
			</Window>
		</div>
		<div class="mt-auto">
			<Window title="current" iconUri="/icons/entry.png">
				<div class="prose prose-ralsei leading-6">
					<ul>
						<li>playing void stranger, ace combat 7, helldivers 2, warframe</li>
						<li>working on this website (duh)</li>
						<li>adding stuff to my godot boids addon</li>
					</ul>
				</div>
			</Window>
		</div>
	</div>
</div>