<script lang="ts">
    import Window from "../../components/window.svelte";
    import "../../styles/app.css";

    export let title;
    export let excerpt;
</script>

<svelte:head>
    <meta property="og:description" content={excerpt} />
    <meta property="og:type" content="article" />
</svelte:head>

<div class="lg:mb-[8vh]">
    <Window {title} iconUri='/icons/entry.png'>
        <div class="prose prose-ralsei max-w-[80ch]">
            <slot/>
        </div>
    </Window>
</div>