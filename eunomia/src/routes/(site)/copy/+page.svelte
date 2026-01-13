<script lang="ts">
	import Window from '$components/window.svelte';

	interface Data {
		text: string;
	}
	interface Props {
		data: Data;
	}

	const { data }: Props = $props();
	const { text }: Data = data;

	let copied = $state(false);
</script>

<svelte:head>
	<meta property="og:description" content={text} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="flex justify-center items-center w-[100vw] h-[100vh] px-[15%]">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => {
			navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1000);
		}}
	>
		<Window style="!max-w-full" title={copied ? 'copied!' : 'click to copy'}>
			<span class="text-[32px] text-wrap break-all">{text}</span>
		</Window>
	</div>
</div>
