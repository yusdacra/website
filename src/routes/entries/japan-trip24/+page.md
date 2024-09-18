+++
title = "japan trip 09/24"
date = "2024-09-19"
layout = "blogpost"
excerpt = "photos from my trip to japan"
+++

<script lang="ts">
    export let data;
</script>

## 1-16 / 09 / 2024

some photos i took while on a japan trip

<p>
these are *not* sorted, have fun trying to figure out the actual order
<span class="text-xs italic">(i accidentally stripped the exif data and im too lazy to find the images again)</span>
</p>

<div class="grid gap-x-2 md:grid-cols-4">
{#each data.images as src}
<enhanced:img class="w-full h-full object-cover [transition:transform_.2s] md:hover:[transform:scale(2)]" {src}/>
{/each}
</div>