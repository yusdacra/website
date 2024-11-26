<script lang="ts">
	import Window from './window.svelte'
	import '../styles/app.css'

	export let title
    export let sticky
    export let prose = true
</script>

<Window {title} {sticky}>
    <div class="{prose ? "prose prose-ralsei leading-6 prose-ul:leading-5" : ""}">
        <slot />
    </div>
</Window>