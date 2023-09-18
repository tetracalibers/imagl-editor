<script lang="ts">
  export let on = false
  export let onChange: (on: boolean) => void = () => {}
  export let disabled = false
</script>

<label>
  <input
    type="checkbox"
    bind:checked={on}
    on:change={(e) => onChange(e.currentTarget.checked)}
    {disabled}
  />
  <slot />
</label>
