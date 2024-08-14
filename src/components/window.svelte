<script lang="ts">
	export let title: string;
	export let iconUri: string = '';
</script>

<div
	class="
        flex flex-col
        max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-xl min-w-[30ch] lg:min-w-[40ch] w-fit h-fit
        border-ralsei-white border-ridge border-8 border-t-[12px]
        bg-ralsei-black
    "
>
	<div
		class="
            flex
            p-1 border-ralsei-white border-8
            bg-gradient-to-l from-ralsei-pink-neon to-75%
        "
		style="border-style: hidden hidden ridge hidden;"
	>
		<h1 class="font-monospace text-xl text-ralsei-pink-regular grow justify-self-start self-center">
			{title}
		</h1>
		{#if iconUri !== ''}
			<img class="justify-self-end self-center max-h-7" style="image-rendering: pixelated;" src={iconUri} alt={iconUri} />
		{/if}
	</div>
	<div class="p-2 bg-gradient-to-tl to-ralsei-pink-neon/15 from-ralsei-pink-regular/20">
		<slot />
	</div>
</div>
