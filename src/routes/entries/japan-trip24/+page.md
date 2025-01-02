+++
title = "japan trip 09/24"
date = "2024-09-19"
layout = "blogpost"
excerpt = "photos from my trip to japan"
+++

<script lang="ts">
    import images from './images.json'
    import { CldImage } from 'svelte-cloudinary'
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
{#each images as image}
{@const ogimage = `https://res.cloudinary.com/dgtwf7mar/image/upload/${image}`}
<a class="!animate-none" href={ogimage}><CldImage width={480} height={480} src={image} class="w-full h-full object-cover [image-rendering:high-quality_!important]"/></a>
{/each}
</div>