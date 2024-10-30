<script lang="ts">
    export let punct: boolean = false;
    export let keywd: boolean = false;
    export let funct: boolean = false;
    export let str: boolean = false;

    export let small: boolean = false;

    export let v: string;

    const ty =
        punct ? "punctuation"
        : keywd ? "keyword"
        : funct ? "function"
        : str ? "string"
        : ""
</script>

<span class="align-middle token {ty} {small ? "text-sm" : ""}">{v}</span>