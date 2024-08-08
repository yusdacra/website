<script lang="ts">
	export let data;
</script>

<div>
    {#each data.posts as post}
        <div>
            <a href="/posts/{post.path}" data-sveltekit-preload-data="hover">
                <p>{post.title}</p>
                <p>{post.excerpt}</p>
            </a>
            <div>
                <time datetime="2020-03-16">{post.published}</time>
            </div>
        </div>
    {/each}
</div>