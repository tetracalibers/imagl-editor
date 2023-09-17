<script lang="ts">
  export let value: number
  export let min: number
  export let max: number
  export let step: number
  export let disabled = false
  export let onChange: (value: number) => void = () => {}
</script>

<label>
  <input
    type="range"
    bind:value
    {min}
    {max}
    {step}
    {disabled}
    on:input={(e) => onChange(e.currentTarget.valueAsNumber)}
  />
  <slot />
</label>
