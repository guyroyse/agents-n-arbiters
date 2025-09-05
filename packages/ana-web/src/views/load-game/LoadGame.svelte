<script lang="ts">
  import { onMount } from 'svelte'
  import AppRouter from '@app/app-router.svelte.ts'
  import LoadGameViewModel from './load-game-view-model.svelte.ts'
  import LoadGameEmpty from './LoadGameEmpty.svelte'
  import LoadGameList from './LoadGameList.svelte'
  import ErrorDialog from '@components/dialogs/ErrorDialog.svelte'

  const appRouter = AppRouter.instance
  const viewModel = new LoadGameViewModel()

  onMount(async () => {
    await viewModel.loadSavedGames()
  })

  function handleBack() {
    appRouter.routeToWelcome()
  }

  function handleRetry() {
    viewModel.loadSavedGames()
  }

  function handleCancel() {
    appRouter.routeToWelcome()
  }
</script>

<section class="h-96 flex flex-col space-y-6">
  <header class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-redis-white">Load Saved Game</h2>
    <button onclick={handleBack} class="text-redis-dusk-30 hover:text-redis-white transition-colors"> ← Back </button>
  </header>

  <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg flex-1 flex flex-col overflow-hidden">
    {#if viewModel.isLoading}
      <div class="flex-1 flex items-center justify-center">
        <div class="text-redis-dusk-30">Loading saved games...</div>
      </div>
    {:else if !viewModel.hasSavedGames}
      <LoadGameEmpty />
    {:else}
      <LoadGameList {viewModel} />
    {/if}
  </div>
</section>

<ErrorDialog
  show={!!viewModel.error}
  title="Error Loading Games"
  message={viewModel.error || 'An unexpected error occurred'}
  onRetry={handleRetry}
  onCancel={handleCancel}
/>
