<script lang="ts">
    import Window from "../../components/window.svelte";
    import "../../styles/app.css";

    export let title;
    export let date;
</script>

<div class="lg:mb-[8vh]">
    <Window {title} iconUri='/icons/entry.png'>
        <div class="prose prose-ralsei max-w-[80ch]">
            <slot/>
        </div>
    </Window>
</div>