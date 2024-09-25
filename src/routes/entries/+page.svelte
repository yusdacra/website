<script lang="ts">
	import Window from '../../components/window.svelte';
	import type { PostData } from './+layout';

	export let data;

	let posts: PostData[] = data.posts as PostData[];
</script>

<div class="flex flex-col lg:flex-row gap-y-4 lg:mx-3 lg:my-4">
	{#each posts as post, index}
		{@const x = index % 2 === 0 ? 'lg:ml-16' : 'lg:ml-36'}
		{@const y = index % 2 === 0 ? 'lg:mt-6' : 'lg:mt-10'}
		<div class="{x} {y}">
			<Window title={post.metadata.title} iconUri='/icons/entry.png'>
				<a
					href="/entries/{post.path}"
					title="cd /entries/{post.path}"
					data-sveltekit-preload-data="hover"
				>
					<div class="flex flex-col gap-y-1 prose prose-ralsei">
						<ul>
							<li>published on: <time datetime="2024-08-11 12:00:00">{post.published}</time></li>
							<li class="max-w-80 text-wrap">excerpt: {post.metadata.excerpt}</li>
						</ul>
						<strong class="place-self-end text-ralsei-green-light"> read more... </strong>
					</div>
				</a>
			</Window>
		</div>
	{/each}
</div>
