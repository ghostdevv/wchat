<script lang="ts">
	import IconEyeOff from '~icons/lucide/eye-off';
	import IconEye from '~icons/lucide/eye';

	export let value: string | undefined | null = '';
	export let placeholder = '';
	export let name = 'password';
	export let disabled = false;

	let type: 'text' | 'password' = 'password';

	function toggle() {
		type = type === 'text' ? 'password' : 'text';
	}
</script>

<div class="toggle-password">
	<input
		{type}
		{name}
		{value}
		{disabled}
		{placeholder}
		id={name}
		on:input={(event) => (value = event.currentTarget.value)}
		required
	/>

	<button type="button" on:click={toggle} class="icon toggle" {disabled}>
		{#if type == 'text'}
			<IconEyeOff />
		{:else}
			<IconEye />
		{/if}
	</button>
</div>

<style lang="scss">
	.toggle-password {
		width: 100%;
		position: relative;

		.toggle {
			position: absolute;
			top: 50%;
			right: 16px;
			transform: translateY(-50%);
		}
	}
</style>
