<script lang="ts">
  import { onMount } from 'svelte'

  import GameHistoryList from './GameHistoryList.svelte'
  import GameInput from './GameInput.svelte'
  import GameViewModel from './GameViewModel.svelte.ts'

  interface Props {
    savedGameId: string
  }

  let { savedGameId }: Props = $props()

  const viewModel = new GameViewModel(savedGameId)

  onMount(async () => {
    await viewModel.loadGameHistory()
  })
</script>

<section class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4 font-mono text-sm h-96 flex flex-col">
  <h3 class="text-redis-white mb-2 font-semibold">Game Terminal</h3>
  <GameHistoryList {viewModel} />
  <GameInput {viewModel} />
</section>
