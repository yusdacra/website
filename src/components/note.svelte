<script context="module" lang="ts">
	import type { Post } from "@skyware/bot";

    export interface OutgoingLink {
        name: string,
        link: string,
    }
    export interface NoteData {
        content: string,
        published: number,
        hasMedia: boolean,
        hasQuote: boolean,
        outgoingLinks?: OutgoingLink[],
    }

    export const noteFromBskyPost = (post: Post): NoteData => {
        return {
            content: post.text,
            published: post.createdAt.getTime(),
            outgoingLinks: [{ name: "bsky", link: post.uri }],
            hasMedia: (post.embed?.isImages() || post.embed?.isVideo()) ?? false,
            hasQuote: post.embed?.isRecord() ?? false,
        }
    }
</script>
<script lang="ts">
	import Token from "./token.svelte";

    export let note: NoteData;
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
            return `https://bsky.app/profile/gaze.systems/post/${link.split('/').pop()}`
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
{#if !onlyContent}<Token v={renderDate(note.published)} small={!isHighlighted}/> {/if}<Token v={note.content} str/>
{#if note.hasMedia}<Token v="-contains media-" keywd small/>{/if}
{#if note.hasQuote}<Token v="-contains quote-" keywd small/>{/if}
{#each note.outgoingLinks ?? [] as {name, link}}
{@const color = outgoingLinkColors[name]}
<span class="text-sm"><Token v="(" punct/><a class="hover:motion-safe:animate-squiggle hover:underline" style="color: {color};{getTextShadowStyle(color)}" href={getOutgoingLink(name, link)}>{name}</a><Token v=")" punct/></span>
{/each}
</div>