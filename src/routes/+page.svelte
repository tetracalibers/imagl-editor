<script>
  import Card from "../components/Card.svelte"
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="container">
  <section>
    <h2 class="group-name">mosaic</h2>
    <div class="grid">
      <Card href="/mosaic" title="normal" img={{ src: "/top/mosaic-unicorn.png" }} />
      <Card href="/voronoi-mosaic" title="voronoi" img={{ src: "/top/voronoi_unicorn.png" }} />
    </div>
  </section>

  <section>
    <h2 class="group-name">pencil</h2>
    <div class="grid">
      <Card href="/pencil" title="sketch" img={{ src: "/top/pencil_cat.png" }} />
    </div>
  </section>

  <section>
    <h2 class="group-name">color pencil</h2>
    <div class="grid">
      <Card
        href="/pale-color-pencil"
        title="pale"
        img={{ src: "/top/pale-color-pencil_cat.png" }}
      />
      <Card href="/color-pencil" title="deep" img={{ src: "/top/color-pencil_cat-2.png" }} />
    </div>
  </section>

  <section>
    <h2 class="group-name">stained glass</h2>
    <div class="grid">
      <Card href="/stained-glass-2" title="normal" img={{ src: "/top/standglass_leaves.png" }} />
      <Card href="/stained-glass" title="light" img={{ src: "/top/standglass-light_leaves.png" }} />
    </div>
  </section>
</div>

<style>
  .container {
    padding: 1rem;
    max-width: 64rem;
    margin: 0 auto;
  }

  section + section {
    margin-top: 4rem;
  }

  section {
    padding: 1rem 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .group-name {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 2rem;
  }
  .group-name::before {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--color-text);
    margin-right: 1rem;
  }
  .group-name::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--color-text);
    margin-left: 1rem;
  }
</style>
