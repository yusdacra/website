<script lang="ts">
    import Window from "./window.svelte";

    export let x: string = "translate-x-none"
    export let y: string = "translate-y-full"
    export let targetY: string = "group-hover:-translate-y-[105%]"
    export let targetX: string = "group-hover:-translate-x-2/3"
</script>

<div class="group">
    <div class="absolute scale-0 transition-all [transition-duration:300ms] opacity-0 group-hover:scale-100 group-hover:opacity-100 {y} {x} {targetY} {targetX} transform-gpu">
        <Window tooltip>
            <slot name="tooltipContent">Hello world!</slot>
        </Window>
    </div>
    <slot/>
</div>