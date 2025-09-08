<script lang="ts">
  import LoadGameViewModel from './load-game-view-model.svelte.ts'
  import LoadGameCard from './LoadGameCard.svelte'

  interface Props {
    viewModel: LoadGameViewModel
  }

  let { viewModel }: Props = $props()
</script>

<div class="flex-1 overflow-y-auto p-4 space-y-3">
  {#each viewModel.savedGames as game (game.gameId)}
    <LoadGameCard {game} {viewModel} />
  {/each}
</div>
