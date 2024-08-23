<script lang="ts">
	import Window from '../../components/window.svelte';

	export let data;
	const hasPreviousPage = data.page > 1;
	const hasNextPage = data.hasNext;
</script>

<div class="flex flex-row flex-wrap">
	<div class="fixed">
		<Window title="guestbook">
			<div class="flex flex-col gap-4 w-[60ch]">
				<p>hia, here is the guestbook if you wanna post anything :)</p>
				<p>just be a good human bean pretty please</p>
				<form method="post">
					<div class="entry">
						<div class="flex flex-row">
							<p class="place-self-start grow text-2xl font-monospace">###</p>
							<p class="justify-end self-center text-sm font-monospace">...</p>
						</div>
						<textarea
							class="text-lg ml-0.5 bg-inherit resize-none text-shadow-white placeholder-shown:[text-shadow:none] [field-sizing:content]"
							name="content"
							placeholder="say meow!"
							required
						/>
						<p class="place-self-end text-sm font-monospace">
							--- posted by <input
								type="text"
								name="author"
								placeholder="author"
								class="p-0 bg-inherit border-hidden max-w-[16ch] text-right text-sm text-shadow-white placeholder-shown:[text-shadow:none] [field-sizing:content]"
								required
							/>
						</p>
					</div>
					<div class="flex gap-4 mt-4">
						<input
							type="submit"
							value="post"
							class="text-xl text-ralsei-green-light leading-5 motion-safe:hover:animate-bounce w-fit border-double border-4 p-1 pb-2"
						/>
						{#if data.sendRatelimited}
							<p class="text-error self-center">you are ratelimited, try again in 30 seconds</p>
						{/if}
					</div>
					{#if data.sendError}
						<p class="text-error">got error trying to send post, pls tell me about this</p>
						<details>
							<summary>error</summary>
							<p>{data.sendError}</p>
						</details>
					{/if}
				</form>
			</div>
		</Window>
	</div>
	<div class="grow" />
	<Window title="entries">
		<div class="flex flex-col gap-4 w-[60ch] max-w-[60ch]">
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
					<div class="entry">
						<div class="flex flex-row">
							<p class="place-self-start grow text-2xl font-monospace">
								#{entry_id}
							</p>
							<p class="justify-end self-center text-sm font-monospace">{date}</p>
						</div>
						<p class="text-lg ml-0.5">{entry.content}</p>
						<p class="place-self-end text-sm font-monospace">--- posted by {entry.author}</p>
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
		@apply flex flex-col gap-3 py-2 px-3 bg-ralsei-green-dark/70 border-ralsei-green-light/30 border-x-[3px] border-y-4;
	}
</style>
