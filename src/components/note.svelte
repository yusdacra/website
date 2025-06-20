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
		purposeAction?: string;
		children?: NoteData[];
		depth?: number;
	}

	export const flattenNotes = (note: NoteData, currentDepth: number = 0): NoteData[] => {
		note.depth = currentDepth;
		const flattened = [note];
		if (note.children) {
			note.children.forEach((child) => {
				flattened.push(...flattenNotes(child, currentDepth + 1));
			});
		}
		return flattened;
	};

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
		rootNote: NoteData;
		isHighlighted?: boolean;
		onlyContent?: boolean;
		showOutgoing?: boolean;
		mapOutgoingNames?: Record<string, string>;
	}

	let {
		rootNote,
		isHighlighted = false,
		onlyContent = false,
		showOutgoing = true,
		mapOutgoingNames = {}
	}: Props = $props();

	const getOutgoingLink = ({ name, link }: { name: string; link: string }) => {
		if (name.startsWith('bsky')) {
			// Parse the atproto URI to extract DID and rkey
			const match = link.match(/at:\/\/(did:[^/]+)\/[^/]+\/([^/]+)/);
			if (match && match.length >= 3) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const [_, did, rkey] = match;
				link = `https://bsky.app/profile/${did}/post/${rkey}`;
			}
			if (name === 'bsky-reply') {
				return ['reply', link];
			} else {
				return [name, link];
			}
		}
		return [name, link];
	};
	// this is ASS this should be a tailwind class
	const getTextShadowStyle = (color: string) => {
		return `text-shadow: 0 0 1px theme(colors.ralsei.black), 0 0 5px ${color};`;
	};
	const outgoingLinkColors: Record<string, string> = {
		bsky: 'rgb(0, 133, 255)',
		reply: 'rgb(0, 133, 255)'
	};
</script>

{#each flattenNotes(rootNote) as note}
	<p class="m-0 max-w-[70ch] text-wrap break-words leading-tight align-middle">
		{#if note.depth ?? 0 > 0}
			<span class="inline-block">|{'=='.repeat(note.depth ?? 0)}</span>&gt;
		{/if}
		{#if !onlyContent}
			{#if (note.purposeAction ?? '').length > 0}
				<Token v="({note.purposeAction!})" small={!isHighlighted} funct />
			{/if}
			{#if note.purposeAction !== 'reply'}
				<Token
					title={renderDate(note.published)}
					v={renderRelativeDate(note.published)}
					small={!isHighlighted}
				/>
			{/if}
		{/if}
		<Token v={note.content} str />
		{#if note.hasMedia}<Token v="-contains media-" keywd small />{/if}
		{#if note.hasQuote}<Token v="-contains quote-" keywd small />{/if}
		{#if showOutgoing}
			{#each (note.outgoingLinks ?? []).map(getOutgoingLink) as [name, link]}
				{@const color = outgoingLinkColors[name]}
				{@const viewName = mapOutgoingNames[name] ?? name}
				{#if viewName.length > 0}
					<span class="text-sm"
						><Token v="(" punct /><a
							class="hover:motion-safe:animate-squiggle hover:underline"
							style="color: {color};{getTextShadowStyle(color)}"
							href={link}>{viewName}</a
						><Token v=")" punct /></span
					>
				{/if}
			{/each}
		{/if}
	</p>
{/each}
