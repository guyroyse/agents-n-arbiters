<script lang="ts">
  import Header from '@components/Header.svelte'
  import Footer from '@components/Footer.svelte'
  import Game from '@components/Game.svelte'
</script>

<Header />

<main class="space-y-6">
  <Game savedGameId="demo-game-001" />
</main>

<Footer />
