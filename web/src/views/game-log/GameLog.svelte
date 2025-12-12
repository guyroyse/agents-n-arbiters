<script lang="ts">
  import { onMount } from 'svelte'
  import GameLogViewModel from './game-log-view-model.svelte.ts'
  import AppRouter from '@app/app-router.svelte.ts'
  import AppState from '@app/app-state.svelte.ts'
  import LoadingOverlay from '@components/LoadingOverlay.svelte'
  import GameLogEntry from './GameLogEntry.svelte'

  const appRouter = AppRouter.instance
  const appState = AppState.instance
  const viewModel = new GameLogViewModel(appState.currentGameId!)

  onMount(async () => {
    await viewModel.loadLogs()
  })
</script>

<section
  class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-6 font-mono text-base flex-1 w-full max-w-6xl mx-auto flex flex-col relative min-h-0"
>
  <header class="flex justify-between items-center mb-4">
    <h3 class="text-redis-white font-semibold">Logs</h3>
    <div class="flex gap-3 items-center text-sm">
      <button
        onclick={() => appRouter.routeToWelcome()}
        class="text-redis-dusk-30 hover:text-redis-white transition-colors cursor-pointer"
      >
        ← Back to Menu
      </button>
      <span class="text-redis-dusk-50">|</span>
      <button
        onclick={() => appRouter.routeToGame()}
        class="text-redis-dusk-30 hover:text-redis-white transition-colors cursor-pointer"
      >
        Terminal
      </button>
    </div>
  </header>

  {#if viewModel.error}
    <div class="bg-redis-midnight border border-red-500 text-red-400 p-4 rounded-lg mb-4">
      <strong>Error:</strong>
      {viewModel.error}
    </div>
  {:else if !viewModel.hasLogs && !viewModel.isLoading}
    <div class="text-center py-12">
      <p class="text-redis-dusk-30 text-lg">No logs found for this game.</p>
      <p class="text-redis-dusk-50 mt-2">Logs will appear here as you play.</p>
    </div>
  {:else if viewModel.hasLogs}
    <div class="flex-1 overflow-y-auto bg-redis-midnight rounded-lg p-4">
      {#each viewModel.logs as log (log.id)}
        <GameLogEntry {log} />
      {/each}
    </div>
    <div class="mt-4 text-center text-redis-dusk-30">
      <p>Showing {viewModel.logs.length} log entries</p>
    </div>
  {/if}

  {#if viewModel.isLoading}
    <LoadingOverlay message="Loading logs..." />
  {/if}
</section>
