<script lang="ts">
  import type { SavedGame } from '@ana/shared'
  import LoadGameViewModel from './load-game-view-model.svelte.ts'
  import ConfirmationDialog from '@components/ConfirmationDialog.svelte'
  import AppRouter from '@app/app-router.svelte.ts'
  import AppState from '@app/app-state.svelte.ts'

  interface Props {
    game: SavedGame
    viewModel: LoadGameViewModel
  }

  let { game, viewModel }: Props = $props()

  const appRouter = AppRouter.instance
  const appState = AppState.instance

  function handleSelectGame() {
    appState.currentGameId = game.savedGameId
    appRouter.routeToGame()
  }

  let showDeleteConfirmation = $state(false)

  function handleDelete() {
    showDeleteConfirmation = true
  }

  async function confirmDelete() {
    showDeleteConfirmation = false
    await viewModel.deleteGame(game.savedGameId)
  }

  function cancelDelete() {
    showDeleteConfirmation = false
  }

  const isDeleting = $derived(viewModel.deletingGameId === game.savedGameId)

  function formatLastPlayed(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<div class="bg-redis-dusk/20 border border-redis-dusk-10 rounded-lg p-4 hover:bg-redis-dusk/30 transition-colors group">
  <div class="flex items-center justify-between">
    <button onclick={handleSelectGame} class="flex-1 text-left group-hover:text-redis-white transition-colors">
      <h3 class="text-redis-white font-semibold text-lg">{game.gameName}</h3>
      <p class="text-redis-dusk-30 text-sm">
        Last played: {formatLastPlayed(game.lastPlayed)}
      </p>
    </button>

    <button
      onclick={handleDelete}
      disabled={isDeleting}
      class="ml-4 text-redis-dusk-30 hover:text-red-400 transition-colors disabled:opacity-50 p-2"
      title="Delete game"
    >
      {#if isDeleting}
        <span class="text-xs">Deleting...</span>
      {:else}
        🗑️
      {/if}
    </button>
  </div>
</div>

<ConfirmationDialog
  show={showDeleteConfirmation}
  title="Delete Game?"
  message={`Are you sure you want to delete <strong>\"${game.gameName}\"</strong>? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>
