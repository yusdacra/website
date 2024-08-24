<script lang="ts">
	import Window from '../../components/window.svelte';

	export let data;
	const hasPreviousPage = data.page > 1;
	const hasNextPage = data.hasNext;
</script>

<div class="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
	<Window title="guestbook" iconUri="/icons/guestbook.png">
		<div class="flex flex-col gap-4 2xl:w-[60ch]">
			<p>
				hia, here is the guestbook if you wanna post anything :)
				<br />
				just fill the post in and click on your preferred auth method to post
			</p>
			<p>rules: be a good human bean pretty please</p>
			<form method="post">
				<div class="entry entryflex">
					<div class="flex flex-row">
						<p class="place-self-start grow text-2xl font-monospace">###</p>
						<p class="justify-end self-center text-sm font-monospace">...</p>
					</div>
					<textarea
						class="text-lg ml-0.5 bg-inherit resize-none text-shadow-white placeholder-shown:[text-shadow:none] [field-sizing:content]"
						name="content"
						placeholder="say meow!"
						maxlength="512"
						required
					/>
					<p class="place-self-end text-sm font-monospace">--- posted by ...</p>
				</div>
				<div class="entry flex flex-wrap gap-1.5 p-1">
					<p class="text-xl ms-2">auth via:</p>
					{#each ['discord', 'github'] as platform}
						<input
							type="submit"
							value={platform}
							formaction="?/post_{platform}"
							class="text-lg text-ralsei-green-light leading-5 hover:underline motion-safe:hover:animate-squiggle w-fit p-0.5"
						/>
					{/each}
				</div>
				{#if data.sendRatelimited}
					<p class="text-error">you are ratelimited, try again in 30 seconds</p>
				{/if}
				{#if data.sendError}
					<p class="text-error">got error trying to send post</p>
					<details>
						<summary>error</summary>
						<p>{data.sendError}</p>
					</details>
				{/if}
			</form>
		</div>
	</Window>
	<div class="grow" />
	<Window title="entries" iconUri="/icons/entries.png">
		<div class="flex flex-col gap-2 md:gap-4 2xl:w-[60ch]">
			{#if data.getRatelimited}
				<p class="text-error">
					woops, looks like you are being ratelimited, try again in like half a minute :3
				</p>
			{:else if data.getError}
				<p class="text-error">got error trying to fetch entries, pls tell me about this</p>
				<details>
					<summary>error</summary>
					<p>{data.getError}</p>
				</details>
			{:else}
				{#each data.entries as [entry_id, entry] (entry_id)}
					{@const date = new Date(entry.timestamp * 1e3).toLocaleString()}
					<div class="entry entryflex">
						<div class="flex flex-row">
							<p class="place-self-start grow text-2xl font-monospace">
								#{entry_id}
							</p>
							<p class="justify-end self-center text-sm font-monospace">{date}</p>
						</div>
						<p class="text-lg text-wrap overflow-hidden text-ellipsis ml-0.5 max-w-[56ch]">
							{entry.content}
						</p>
						<p
							class="max-w-[45ch] place-self-end text-sm font-monospace overflow-hidden text-ellipsis text-nowrap"
							title={entry.author}
						>
							--- posted by {entry.author}
						</p>
					</div>
				{:else}
					<p>looks like there are no entries :(</p>
				{/each}
			{/if}
			{#if hasPreviousPage || hasNextPage}
				<div class="flex flex-row w-full justify-center items-center font-monospace">
					{#if hasPreviousPage}
						<a href="/guestbook/?page={data.entries.length < 0 ? data.page - 1 : 1}"
							>&lt;&lt; previous</a
						>
					{/if}
					{#if hasNextPage && hasPreviousPage}
						<div class="w-1/12" />
					{/if}
					{#if hasNextPage}
						<a href="/guestbook/?page={data.page + 1}">next &gt;&gt;</a>
					{/if}
				</div>
			{/if}
		</div>
	</Window>
</div>

<style lang="postcss">
	.entry {
		@apply bg-ralsei-green-dark/70 border-ralsei-green-light/30 border-x-[3px] border-y-4;
	}
	.entryflex {
		@apply flex flex-col gap-3 py-2 px-3;
	}
</style>
