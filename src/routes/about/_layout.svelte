<script lang="ts">
	import Window from '../../components/window.svelte'
	import Itches from './itches.md'
	import Stuff from './stuff.md'
	import '../../styles/app.css'

	export let title;
</script>

<div class="flex flex-wrap md:flex-nowrap gap-4 md:gap-8">
	<Window {title} style="ml-auto">
		<div class="prose prose-ralsei leading-6 prose-ul:leading-5 max-w-[80ch]">
			<slot />
		</div>
	</Window>
	<div class="sticky flex flex-col mr-auto gap-4 md:gap-8 !leading-6 prose-ul:!leading-5">
		<Stuff/>
		<Itches/>
	</div>
</div>
