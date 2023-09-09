<script lang="ts">
  let on = false
  export let onChange: (on: boolean) => void = () => {}
</script>

<label>
  <input type="checkbox" bind:checked={on} on:change={(e) => onChange(e.currentTarget.checked)} />
  <slot />
</label>
