<script lang="ts">
    import "../../app.css";

    export let title;
    export let author;
    export let date;
</script>

<div class="prose lg:prose-lg">
    <h1 class="font-mono">{ title }</h1>
    <ul>on: { date }</ul>
    <ul>by: { author }</ul>
    <slot/>
</div>