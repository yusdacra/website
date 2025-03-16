<script lang="ts">


    interface Props {
        punct?: boolean;
        keywd?: boolean;
        funct?: boolean;
        str?: boolean;
        small?: boolean;
        v: string;
        title?: string;
    }

    let {
        punct = false,
        keywd = false,
        funct = false,
        str = false,
        small = false,
        title,
        v
    }: Props = $props();

    const ty =
        punct ? "punctuation"
        : keywd ? "keyword"
        : funct ? "function"
        : str ? "string"
        : ""
</script>

<span {title} class="token {ty} {small ? "text-sm" : ""}">{v}</span>