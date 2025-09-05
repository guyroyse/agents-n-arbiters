<script lang="ts">
  import { onMount } from 'svelte'

  import GameHistoryList from './GameHistoryList.svelte'
  import GameInput from './GameInput.svelte'
  import GameViewModel from './game-view-model.svelte.ts'
  import AppRouter from '@app/app-router.svelte.ts'
  import AppState from '@app/app-state.svelte.ts'

  const appRouter = AppRouter.instance
  const appState = AppState.instance
  const viewModel = new GameViewModel(appState.currentGameId!)

  onMount(async () => {
    await viewModel.loadGameHistory()
  })
</script>

<section class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4 font-mono text-sm h-96 flex flex-col">
  <header class="flex justify-between items-center mb-2">
    <h3 class="text-redis-white font-semibold">Game Terminal</h3>
    <button
      onclick={() => appRouter.routeToWelcome()}
      class="text-redis-dusk-30 hover:text-redis-white text-sm transition-colors"
    >
      ← Back to Menu
    </button>
  </header>
  <GameHistoryList {viewModel} />
  <GameInput {viewModel} />
</section>
