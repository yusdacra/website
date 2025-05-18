<script module lang="ts">
	import type { Post } from '@skyware/bot';

	export interface OutgoingLink {
		name: string;
		link: string;
	}
	export interface NoteData {
		content: string;
		published: number;
		hasMedia: boolean;
		hasQuote: boolean;
		outgoingLinks?: OutgoingLink[];
	}

	export const noteFromBskyPost = (post: Post): NoteData => {
		return {
			content: post.text,
			published: post.createdAt.getTime(),
			outgoingLinks: [{ name: 'bsky', link: post.uri }],
			hasMedia:
				(post.embed?.isImages() || post.embed?.isVideo() || post.embed?.isRecordWithMedia()) ??
				false,
			hasQuote: (post.embed?.isRecord() || post.embed?.isRecordWithMedia()) ?? false
		};
	};
</script>

<script lang="ts">
	import Token from './token.svelte';
	import { renderDate, renderRelativeDate } from '$lib/dateFmt';

	interface Props {
		note: NoteData;
		isHighlighted?: boolean;
		onlyContent?: boolean;
		showOutgoing?: boolean;
	}

	let { note, isHighlighted = false, onlyContent = false, showOutgoing = true }: Props = $props();

	const getOutgoingLink = (name: string, link: string) => {
		if (name === 'bsky') {
			return `https://bsky.app/profile/gaze.systems/post/${link.split('/').pop()}`;
		}
		return link;
	};
	// this is ASS this should be a tailwind class
	const getTextShadowStyle = (color: string) => {
		return `text-shadow: 0 0 1px theme(colors.ralsei.black), 0 0 5px ${color};`;
	};
	const outgoingLinkColors: Record<string, string> = {
		bsky: 'rgb(0, 133, 255)'
	};
</script>

<p class="m-0 max-w-[70ch] text-wrap break-words leading-tight align-middle">
	{#if !onlyContent}<Token
			title={renderDate(note.published)}
			v={renderRelativeDate(note.published)}
			small={!isHighlighted}
		/>{/if}
	<Token v={note.content} str />
	{#if note.hasMedia}<Token v="-contains media-" keywd small />{/if}
	{#if note.hasQuote}<Token v="-contains quote-" keywd small />{/if}
	{#if showOutgoing}
		{#each note.outgoingLinks ?? [] as { name, link }}
			{@const color = outgoingLinkColors[name]}
			<span class="text-sm"
				><Token v="(" punct /><a
					class="hover:motion-safe:animate-squiggle hover:underline"
					style="color: {color};{getTextShadowStyle(color)}"
					href={getOutgoingLink(name, link)}>{name}</a
				><Token v=")" punct /></span
			>
		{/each}
	{/if}
</p>
