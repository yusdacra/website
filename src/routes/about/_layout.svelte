<script lang="ts">
	import Window from '../../components/window.svelte'
	import Itches from './itches.md'
	import Stuff from './stuff.md'
	import '../../styles/app.css'

	export let title;
</script>

<article class="flex flex-wrap md:flex-nowrap gap-4 h-entry">
	<Window {title}>
		<div class="prose prose-ralsei leading-6 prose-ul:leading-5 max-w-[80ch] e-content">
			<slot />
		</div>
	</Window>
	<div class="sticky flex flex-col gap-4 !leading-6 prose-ul:!leading-5">
		<Stuff/>
		<Itches/>
	</div>
</article>
