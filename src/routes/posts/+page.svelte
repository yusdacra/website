<script lang="ts">
	import type { PostData } from './+page.js';

	export let data;

    let posts: PostData[] = data.posts as PostData[];
</script>

<div>
    {#each posts as post}
        <div>
            <a href="/posts/{post.path}" data-sveltekit-preload-data="hover">
                <p>{post.metadata.title}</p>
                <p>{post.metadata.excerpt}</p>
            </a>
            <div>
                <time datetime="2020-03-16">{post.published}</time>
            </div>
        </div>
    {/each}
</div>