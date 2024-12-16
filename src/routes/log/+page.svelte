<script lang="ts">
	import Window from '../../components/window.svelte';
    import Token from '../../components/token.svelte';

	export let data;

    const renderDate = (timestamp: number) => {
        return (new Date(timestamp)).toLocaleString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const highlightedNote = data.notes.get(data.highlightedNote ?? '') ?? null

    const getOutgoingLink = (name: string, link: string) => {
        if (name === "bsky") {
            if (link.startsWith("https://bsky.gaze.systems")) {
                return link
            }
            return `https://bsky.gaze.systems/post/${link.split('/').pop()}`
        }
        return link
    }
    // this is ASS this should be a tailwind class
    const getTextShadowStyle = (color: string) => {
        return `text-shadow: 0 0 1px theme(colors.ralsei.black), 0 0 5px ${color};`
    }
    const outgoingLinkColors: Record<string, string> = {
        bsky: "rgb(0, 133, 255)",
    }
</script>

<svelte:head>
    {#if highlightedNote !== null}
        <meta property="og:description" content={highlightedNote.content} />
        <meta property="og:title" content="log #{data.highlightedNote}" />
    {/if}
</svelte:head>

<Window title="terminal" removePadding>
<div
    class="
        prose prose-ralsei
        prose-pre:rounded-none prose-pre:!m-0 prose-pre:!p-2
        prose-pre:!bg-ralsei-black prose-code:!bg-ralsei-black
    "
>
<pre class="language-bash"><code class="language-bash"><nobr>
<Token v="[" punct/>gazesystems <Token v="/" keywd/><Token v="]$" punct/> <Token v="source" funct/> <Token v="scripts/log.nu" />
<br>
<Token v="[" punct/>gazesystems <Token v="/" keywd/><Token v="]$" punct/> <Token v="ls" funct/> <Token v="log" /> <Token v="|" punct/> <Token v="each" funct/> <Token v="&#123;" punct/><Token v="|" punct/><Token v="file"/><Token v="|" punct/> <Token v="render" funct/> <Token v="(" punct/><Token v="open" funct/> <Token v="$file.name" /><Token v=")" punct/><Token v="&#125;" punct/>
<br>
<br>
{#each data.notes as [noteId, note], index}
{@const isHighlighted = noteId === data.highlightedNote}
<div class="text-wrap break-words max-w-[70ch] leading-none">
<Token v={renderDate(note.published)} small={!isHighlighted}/> <Token v={noteId} keywd small={!isHighlighted}/><Token v="#" punct/>&nbsp;&nbsp;<Token v={note.content} str/>
{#each note.outgoingLinks ?? [] as {name, link}}
{@const color = outgoingLinkColors[name]}
<span class="text-sm"><Token v="(" punct/><a style="color: {color};{getTextShadowStyle(color)}" href={getOutgoingLink(name, link)}>{name}</a><Token v=")" punct/></span>
{/each}
</div>
{#if index < data.notes.size - 1}
<div class="mt-3"/>
{/if}
{/each}
</nobr></code></pre>
</div>
</Window>
