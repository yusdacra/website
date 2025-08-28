<script lang="ts">
	import Window from '$components/window.svelte';
	import type { PostData } from './+layout.server.ts';
	import LogPage from '../log/+page.svelte';
	import type { NoteData } from '$components/note.svelte';

	interface Props {
		data: {
			posts: PostData[];
			feedPosts: NoteData[];
		};
	}

	let { data }: Props = $props();
</script>

<div class="mx-auto md:max-w-fit flex flex-col-reverse md:flex-row gap-y-4 gap-x-16">
	<div class="flex flex-col gap-y-4">
		{#each data.posts as post (post.path)}
			<Window title={post.metadata.title} iconUri="/icons/entry.webp">
				<a
					href="/entries/{post.path}"
					title="cd /entries/{post.path}"
					data-sveltekit-preload-data="off"
				>
					<div class="flex flex-col prose prose-ralsei leading-5">
						<ul>
							<li>
								published on: <time datetime="{post.metadata.date} 00:00:00">{post.published}</time>
							</li>
							<li class="max-w-[34ch] text-wrap">excerpt: {post.metadata.excerpt}</li>
						</ul>
						<strong class="place-self-end text-ralsei-green-light"> read more... </strong>
					</div>
				</a>
			</Window>
		{/each}
	</div>
	<LogPage data={{ feedPosts: data.feedPosts }} />
</div>
