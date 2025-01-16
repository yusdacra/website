<script lang="ts">
	import type { Note } from "$lib/notes";
	import Token from "./token.svelte";

    export let id: string;
    export let note: Note;
    export let isHighlighted = false;
    export let onlyContent = false;
    
    const renderDate = (timestamp: number) => {
        return (new Date(timestamp)).toLocaleString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

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

<div class="text-wrap break-words max-w-[70ch] leading-none">
{#if !onlyContent}<Token v={renderDate(note.published)} small={!isHighlighted}/> <Token v={id} keywd small={!isHighlighted}/><Token v="#" punct/>&nbsp;&nbsp;{/if}<Token v={note.content} str/>
{#each note.outgoingLinks ?? [] as {name, link}}
{@const color = outgoingLinkColors[name]}
<span class="text-sm"><Token v="(" punct/><a style="color: {color};{getTextShadowStyle(color)}" href={getOutgoingLink(name, link)}>{name}</a><Token v=")" punct/></span>
{/each}
</div>