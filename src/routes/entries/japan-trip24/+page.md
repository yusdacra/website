+++
title = "japan trip 09/24"
date = "2024-09-19"
layout = "blogpost"
excerpt = "photos from my trip to japan"
+++

<script lang="ts">
    import { CldImage } from 'svelte-cloudinary'

    export let data
</script>

<style>
    picture {
        margin: 0 !important;
    }
</style>

## 1-16 / 09 / 2024

photos i took while on a japan trip

~~these are *not* sorted, have fun trying to figure out the actual order (i accidentally stripped the exif data and im too lazy to find the images again)~~
fixed!!!! i also added a few images because im dumb and forgot

*(you can click on an image to see original!)*

<div class="grid gap-0.5 auto-rows-min md:grid-cols-4">
{#each data.images as image}
<a class="!animate-none" href={image}><CldImage width={480} height={480} src={image} class="w-full h-full object-cover [image-rendering:high-quality_!important]"/></a>
{/each}
</div>