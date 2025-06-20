<script lang="ts">
	import Note, { type NoteData } from '../../components/note.svelte';
	import Token from '../../components/token.svelte';
	import Window from '../../components/window.svelte';

	interface Props {
		data: {
			entries: NoteData[];
			sendError: string;
			getError: string;
			sendRatelimited: string;
			getRatelimited: boolean;
			fillText: string;
		};
	}

	let { data }: Props = $props();

	const placeholders = ['meow', 'arf', '0110100001101001', '0x6869'];
</script>

<div class="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
	<Window title="guestbook" style="ml-auto" iconUri="/icons/guestbook.webp">
		<div class="flex flex-col gap-1 max-w-[50ch] leading-6">
			<div class="prose prose-ralsei leading-6 entry p-2">
				<p>hia, here is the guestbook if you wanna post anything :)</p>
				<p>be good pretty please (and don't be shy!!!)</p>
				<p class="text-sm italic">
					(to see all the entries, look <a href="https://bsky.app/profile/guestbook.gaze.systems"
						>here</a
					>)
				</p>
			</div>
			<form method="post">
				<div class="entry entryflex">
					<textarea
						class="text-lg p-1 m-0 ml-0.5 bg-transparent resize-none text-shadow-white placeholder-shown:[text-shadow:none] [field-sizing:content] border-none"
						name="content"
						placeholder="say {placeholders[Math.floor(Math.random() * placeholders.length)]}!"
						maxlength="300"
						required
					></textarea>
				</div>
				<div class="flex flex-row gap-1 mt-1">
					<input
						type="submit"
						value="click to post"
						formaction="?/post"
						class="entry text-ralsei-green-light leading-none hover:underline motion-safe:hover:animate-squiggle p-1 z-50"
					/>
					<div class="marquee-wrapper entry text-ralsei-white/50">
						<div class="marquee font-monospace">
							<p class="text-shadow-none">{data.fillText}</p>
							<p class="text-shadow-none">{data.fillText}</p>
						</div>
					</div>
				</div>
				{#if data.sendRatelimited}
					<p class="text-error">you are ratelimited, try again in 30 seconds</p>
				{/if}
				{#if data.sendError}
					<details class="w-[50ch]">
						<summary class="text-error">got error trying to send post</summary>
						<p>{data.sendError}</p>
					</details>
				{/if}
			</form>
		</div>
	</Window>
	<Window
		id="guestbookentries"
		style="mr-auto"
		title="entries"
		iconUri="/icons/entries.webp"
		removePadding
	>
		<div class="flex flex-col gap-2 md:gap-4 2xl:w-[60ch]">
			{#if data.getRatelimited}
				<p class="text-error">
					woops, looks like you are being ratelimited, try again in like half a minute :3
				</p>
			{:else if data.getError}
				<details class="w-[50ch]">
					<summary class="text-error">got error trying to fetch entries</summary>
					<p>{data.getError}</p>
				</details>
			{:else}
				<div
					class="
						prose prose-ralsei
						prose-pre:rounded-none prose-pre:!m-0 prose-pre:!p-2
						prose-pre:!bg-ralsei-black prose-code:!bg-ralsei-black
					"
				>
					<pre class="language-bash"><code class="language-bash"
							><nobr>
				<Token v="[" punct />gazesystems <Token v="/" keywd /><Token v="]$" punct /> <Token
									v="source"
									funct
								/> <Token v="scripts/log.nu" />
				<br />
				<Token v="[" punct />gazesystems <Token v="/" keywd /><Token v="]$" punct /> <Token
									v="let"
									funct
								/> <Token v="entries" /> <Token v="=" punct /> <Token v="(" punct /><Token
									v="ls"
									funct
								/> <Token v="guestbook" /> <Token v="|" punct /> <Token v="reverse" funct /> <Token
									v="|"
									punct
								/> <Token v="take" funct /> <Token v="16" /><Token v=")" punct />
				<br />
				<Token v="[" punct />gazesystems <Token v="/" keywd /><Token v="]$" punct /> <Token
									v="$entries"
								/> <Token v="|" punct /> <Token v="each" funct /> <Token v="&#123;" punct /><Token
									v="|"
									punct
								/><Token v="file" /><Token v="|" punct /> <Token v="render" funct /> <Token
									v="("
									punct
								/><Token v="open" funct /> <Token v="$file.name" /><Token v=")" punct /><Token
									v="&#125;"
									punct
								/>
				<br />
				<br />
				{#each data.entries as note, index}
									<Note
										mapOutgoingNames={{ bsky: '', reply: 'src' }}
										showOutgoing={true}
										rootNote={note}
									/>
				{#if index < data.entries.length - 1}
										<div class="mt-3"></div>
									{/if}
								{/each}
				</nobr></code
						></pre>
				</div>
			{/if}
		</div>
	</Window>
</div>

<style lang="postcss">
	.entry {
		@apply bg-ralsei-green-dark/70 border-ralsei-green-light/30 border-x-[4px] border-y-[5px];
		border-style: ridge;
	}
	.entryflex {
		@apply flex flex-col p-1;
	}

	.marquee-wrapper {
		max-width: 100%;
		overflow: hidden;
	}

	.marquee {
		white-space: nowrap;
		overflow: hidden;
		display: inline-block;
		animation: marquee 10s linear infinite;
	}

	.marquee p {
		transform: translateY(15%);
		display: inline-block;
	}

	@keyframes marquee {
		0% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(-50%, 0, 0);
		}
	}
</style>
