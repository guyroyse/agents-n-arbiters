<script lang="ts">
  import type GameViewModel from './game-view-model.svelte.ts'
  import GameHistoryListItem from './GameHistoryListItem.svelte'

  interface Props {
    viewModel: GameViewModel
  }

  let { viewModel }: Props = $props()
  let historyElement: HTMLDivElement

  $effect(() => {
    // Track reactive dependencies, removing this means that the scroll position won't update
    viewModel.historyCount
    viewModel.isLoading

    // Scroll to bottom
    if (historyElement) historyElement.scrollTop = historyElement.scrollHeight
  })
</script>

<div bind:this={historyElement} class="flex-1 overflow-y-auto mb-4 space-y-2">
  {#each viewModel.history as entry}
    <GameHistoryListItem {entry} />
  {/each}

  {#if viewModel.isLoading}
    <div class="text-redis-dusk-30 pl-2">Processing...</div>
  {/if}
</div>
