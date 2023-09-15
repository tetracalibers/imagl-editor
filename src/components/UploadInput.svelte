<script lang="ts">
  export let onChange: (file: File) => void

  let files: FileList

  $: if (files) {
    onChange(files[0])
  }
</script>

<input type="file" accept="image/png, image/jpeg" bind:files />
