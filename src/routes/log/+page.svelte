<script lang="ts">
	import Window from '../../components/window.svelte';
    import Token from '../../components/token.svelte';
    import Note from '../../components/note.svelte';

	export let data;
</script>

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
{#each data.feedPosts as note, index}
<Note {note}/>
{#if index < data.feedPosts.length - 1}
<div class="mt-3"/>
{/if}
{/each}
</nobr></code></pre>
</div>
</Window>
