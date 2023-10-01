<script lang="ts">
  export let on = false
  export let onChange: (on: boolean) => void = () => {}
  export let disabled = false
</script>

<label class="switch">
  <input
    class="checkbox"
    type="checkbox"
    bind:checked={on}
    on:change={(e) => onChange(e.currentTarget.checked)}
    {disabled}
  />
  <div class="knobs" />
  <div class="layer" />
</label>

<style>
  .switch {
    --off-bg: #dde6ed;
    --off-fg: #9db2bf;
    --on-bg: #1ee494;
    --on-fg: #6effbf;
    display: block;
    position: relative;
    width: 74px;
    height: 36px;
    overflow: hidden;
  }

  .knobs,
  .layer {
    position: absolute;
    inset: 0;
  }

  .switch,
  .layer {
    border-radius: 999px;
  }

  .checkbox {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
    z-index: 3;
  }

  .knobs {
    z-index: 2;
  }

  .layer {
    width: 100%;
    background-color: var(--off-fg);
    transition: 0.3s ease all;
    z-index: 1;
  }

  .knobs:before {
    content: "OFF";
    position: absolute;
    top: 4px;
    left: 4px;
    width: 20px;
    height: 10px;
    color: #fff;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    padding: 9px 4px;
    background-color: var(--off-bg);
    border-radius: 50%;
    transition: 0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15) all;
  }

  .checkbox:checked + .knobs:before {
    content: "ON";
    left: 42px;
    background-color: var(--on-fg);
  }

  .checkbox:checked ~ .layer {
    background-color: var(--on-bg);
  }
</style>
