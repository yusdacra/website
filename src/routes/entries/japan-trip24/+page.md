+++
title = "japan trip 09/24"
date = "2024-09-19"
layout = "blogpost"
excerpt = "photos from its trip to japan"
+++

<script lang="ts">
    export let data
</script>

## 1-16 / 09 / 2024

photos it took while on a japan trip

~~these are *not* sorted, have fun trying to figure out the actual order (it accidentally stripped the exif data and its too lazy to find the images again)~~
fixed!!!! it also added a few images because its dumb and forgot

*(you can click on an image to see original!)*

<div class="grid gap-0.5 auto-rows-min md:grid-cols-4">
{#each data.images as image}
<a class="!animate-none" href={image.og}><img loading="lazy" width={480} height={480} src={image.thumb} alt="from japan trip" class="w-full h-full object-cover [image-rendering:high-quality_!important]"/></a>
{/each}
</div>
