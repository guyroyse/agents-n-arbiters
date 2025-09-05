<script lang="ts">
  import { onMount } from 'svelte'
  import AppRouter from '@app/app-router.svelte.ts'
  import AppState from '@app/app-state.svelte.ts'
  import NewGameViewModel from './new-game-view-model.svelte.ts'

  const appRouter = AppRouter.instance
  const appState = AppState.instance
  const viewModel = new NewGameViewModel()

  let gameNameInput: HTMLInputElement

  onMount(() => {
    if (gameNameInput) {
      gameNameInput.focus()
      gameNameInput.select()
    }
  })

  async function handleStartGame() {
    const gameId = await viewModel.startGame()
    if (gameId) {
      appState.currentGameId = gameId
      appRouter.routeToGame()
    }
  }

  function handleBack() {
    appRouter.routeToWelcome()
  }
</script>

<section class="flex flex-col items-center justify-center min-h-96 space-y-8">
  <div class="text-center space-y-6">
    <h2 class="text-2xl font-bold text-redis-white">Create New Game</h2>

    <input
      bind:this={gameNameInput}
      bind:value={viewModel.gameName}
      disabled={viewModel.isCreatingGame}
      class="bg-redis-dusk-10 text-redis-midnight text-center px-3 py-2 rounded-sm outline-none transition-colors font-bold text-xl tracking-wide w-80 disabled:opacity-50 selection:bg-redis-dusk-30"
    />
  </div>

  <div class="flex flex-col space-y-4 w-80">
    <button
      onclick={handleStartGame}
      disabled={viewModel.isCreatingGame}
      class="bg-redis-dusk hover:bg-redis-dusk-70 border-2 border-redis-dusk-10 disabled:opacity-50 disabled:cursor-not-allowed text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 cursor-pointer shadow-lg"
    >
      {viewModel.isCreatingGame ? 'Creating Game...' : 'Start Adventure'}
    </button>

    <button
      onclick={handleBack}
      disabled={viewModel.isCreatingGame}
      class="border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-dusk-10 hover:text-redis-white disabled:opacity-50 font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 cursor-pointer shadow-md"
    >
      Back
    </button>
  </div>

  {#if viewModel.error}
    <div class="text-red-400 text-center">
      {viewModel.error}
    </div>
  {/if}
</section>
