<script lang="ts">
  import { base } from "$app/paths"

  export let title: string
  export let img: { src: string; alt?: string }
  export let href: string
</script>

<a class="Card" href={base + href}>
  <img class="image" src={base + img.src} alt={img.alt ?? ""} />
  <h3 class="title">
    {title}
  </h3>
</a>

<style>
  .Card {
    display: grid;
    align-items: flex-end;
    color: var(--color-text);
    max-width: 100vw;
  }

  .image,
  .title {
    grid-area: 1 / 1;
  }

  .title {
    margin: 0;
    text-align: center;
  }

  .image {
    width: 100%;
    aspect-ratio: 5 / 4;
    object-fit: cover;
    /** グラデーションを挟んでテキストを読みやすく */
    -webkit-mask-image: linear-gradient(to top, #ffffff00 0%, #ffffff 100%);
    mask-image: linear-gradient(to top, #ffffff00 0%, #ffffff 100%);
    border-radius: 10px;
    object-view-box: inset(10% 0 0 0);
  }
</style>
