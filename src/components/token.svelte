<script lang="ts">


    interface Props {
        punct?: boolean;
        keywd?: boolean;
        funct?: boolean;
        str?: boolean;
        small?: boolean;
        v: string;
    }

    let {
        punct = false,
        keywd = false,
        funct = false,
        str = false,
        small = false,
        v
    }: Props = $props();

    const ty =
        punct ? "punctuation"
        : keywd ? "keyword"
        : funct ? "function"
        : str ? "string"
        : ""
</script>

<span class="align-middle token {ty} {small ? "text-sm" : ""}">{v}</span>