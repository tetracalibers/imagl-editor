<script lang="ts">
  export let onChange: (file: File) => void

  let files: FileList
</script>

<input type="file" accept="image/png, image/jpeg" bind:files on:change={() => onChange(files[0])} />
