<script lang="ts">
  import AppRouter from '@app/app-router.svelte.ts'

  const appRouter = AppRouter.instance

  function handleNewGame() {
    appRouter.routeToNewGame()
  }

  function handleLoadGame() {
    appRouter.routeToLoad()
  }
</script>

<section class="flex flex-col items-center justify-center min-h-96 space-y-8">
  <div class="flex flex-col space-y-6 w-80">
    <button
      onclick={handleNewGame}
      class="bg-redis-dusk hover:bg-redis-dusk-70 border-2 border-redis-dusk-10 text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 cursor-pointer shadow-lg"
    >
      New Game
    </button>

    <button
      onclick={handleLoadGame}
      class="border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-dusk-10 hover:text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 cursor-pointer shadow-md"
    >
      Load Game
    </button>
  </div>

</section>
