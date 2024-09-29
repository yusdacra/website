<script lang="ts">
	import Window from '../../components/window.svelte';
	import '../../styles/app.css';

	export let title;
</script>

<article class="flex flex-wrap md:flex-nowrap gap-4 h-entry">
	<Window {title}>
		<div class="prose prose-ralsei leading-6 prose-ul:leading-none max-w-[80ch] e-content">
			<slot />
		</div>
	</Window>
	<Window title="itches" sticky>
		<div class="prose prose-ralsei pr-2 leading-6">
			<ul>
				<li>website / social presence todos on <a href="https://indieweb.org/User:Gaze.systems">the indieweb wiki</a></li>
				<li>want to start reading chaos;head and chaos;child</li>
				<li>start playing killer7 and the silver case etc.</li>
				<li>participate in yet another game jam</li>
				<li>stream game dev stuff (...if i can stop being anxiety x1000)</li>
				<li>fly more in VTOL VR with people</li>
			</ul>
		</div>
	</Window>
</article>
