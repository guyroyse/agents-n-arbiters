<script lang="ts">
  import AppRouter from '@app/app-router.svelte.ts'

  const appRouter = AppRouter.instance

  function handleNewGame() {
    appRouter.routeToNewGame()
  }
</script>

<div class="flex-1 flex items-center justify-center flex-col space-y-6">
  <div class="text-center text-redis-dusk-30 space-y-2">
    <p class="text-lg">No saved games found</p>
    <p class="text-sm">Create your first adventure!</p>
  </div>
  <button
    onclick={handleNewGame}
    class="bg-redis-dusk hover:bg-redis-dusk-70 border-2 border-redis-dusk-10 text-redis-white font-bold text-lg tracking-wide py-3 px-6 rounded-lg transition-colors cursor-pointer"
  >
    Create New Game
  </button>
</div>