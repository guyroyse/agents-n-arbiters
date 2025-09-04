<script lang="ts">
  import type { GameHistoryEntry } from '@ana/shared'
  import GameHistoryListItem from '@components/GameHistoryListItem.svelte'

  interface Props {
    history: GameHistoryEntry[]
    isLoading: boolean
  }

  let { history, isLoading }: Props = $props()
  let historyContainer: HTMLDivElement

  $effect(() => {
    // Track reactive dependencies, removing this means that the scroll position won't update
    history.length
    isLoading

    // Scroll to bottom
    if (historyContainer) historyContainer.scrollTop = historyContainer.scrollHeight
  })
</script>

<div bind:this={historyContainer} class="flex-1 overflow-y-auto mb-4 space-y-2">
  {#each history as entry}
    <GameHistoryListItem {entry} />
  {/each}

  {#if isLoading}
    <div class="text-redis-dusk-30 pl-2">Processing...</div>
  {/if}
</div>
