<script lang="ts">
    import Window from '../../components/window.svelte';
    
    export let data;
</script>

<div class="flex">
    <Window title="notes">
        <div class="prose prose-ralsei">
<pre class="language-bash"><code class="language-bash"><span class="token punctuation">[</span>gazesystems <span class="token keyword">/notes/</span><span class="token punctuation">]$</span> <span class="token function">cat</span> *
{#each data.notes as {noteId, note}}
<br>
<span class="token keyword">{noteId}</span><span class="token punctuation">|>   </span><span class="token string">{note.content}</span>
{/each}
</code></pre>
        </div>
    </Window>
</div>
