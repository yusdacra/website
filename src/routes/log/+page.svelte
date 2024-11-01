<script lang="ts">
	import Window from '../../components/window.svelte';
    import Token from '../../components/token.svelte';

	export let data;

    const renderDate = (timestamp: number) => {
        return (new Date(timestamp)).toLocaleString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
        })
    }

    const highlightedNote = data.notes.get(data.highlightedNote ?? '') ?? null
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
<Token v="[" punct/>gazesystems <Token v="/log/" keywd/><Token v="]$" punct/> <Token v="source" funct/> log.nu
<br>
<Token v="[" punct/>gazesystems <Token v="/log/" keywd/><Token v="]$" punct/> <Token v="ls" funct/> log <Token v="|" punct/> <Token v="each" funct/> <Token v="&#123;" punct/><Token v="|" punct/>file<Token v="|" punct/> <Token v="render" funct/> <Token v="(" punct/><Token v="open" funct/> $file.name<Token v=")" punct/><Token v="&#125;" punct/>
<br>
<br>
{#each data.notes as [noteId, note], index}
{@const isHighlighted = noteId === data.highlightedNote}
<div class="text-wrap break-words max-w-[70ch] leading-none">
<Token v={renderDate(note.published)} small={!isHighlighted}/> <Token v={noteId} keywd small={!isHighlighted}/><Token v="#" punct/>&nbsp;&nbsp;<Token v={note.content} str/>
</div>
{#if index < data.notes.size - 1}
<div class="mt-3"/>
{/if}
{/each}
</nobr></code></pre>
</div>
</Window>
