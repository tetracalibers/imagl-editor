<script lang="ts">
  export let title: string
</script>

<div class="control-item">
  <h2 class="title">{title}</h2>
  <slot />
</div>

<style>
  .control-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    margin: 0;
  }
</style>
