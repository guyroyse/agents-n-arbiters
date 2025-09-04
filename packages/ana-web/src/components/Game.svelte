<script lang="ts">
  import { onMount } from 'svelte'
  import type { TakeTurnResponse, GameHistoryEntry } from '@ana/shared'
  import { takeTurn, fetchGameHistory } from '@lib/api'
  import GameHistoryList from '@components/GameHistoryList.svelte'
  import GameInput from '@components/GameInput.svelte'

  interface Props {
    savedGameId: string
  }

  let { savedGameId }: Props = $props()

  let history: GameHistoryEntry[] = $state([])
  let currentCommand = $state('')
  let isLoading = $state(false)

  function clearInput() {
    currentCommand = ''
  }

  function appendHistory(command: string, response: string) {
    history = [...history, { command, response }]
  }

  async function handleSubmit(command: string) {
    clearInput()
    isLoading = true

    try {
      const response = await takeTurn({ savedGameId, command })
      appendHistory(command, response.result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      appendHistory(command, `Error: ${errorMessage}`)
    } finally {
      isLoading = false
    }
  }

  onMount(async () => {
    isLoading = true
    try {
      history = await fetchGameHistory(savedGameId)
    } catch (error) {
      console.error('Failed to load game history:', error)
      // Start with empty history on error
      history = []
    } finally {
      isLoading = false
    }
  })
</script>

<section class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4 font-mono text-sm h-96 flex flex-col">
  <h3 class="text-redis-white mb-2 font-semibold">Game Terminal</h3>
  <GameHistoryList {history} {isLoading} />
  <GameInput bind:currentCommand {isLoading} onSubmit={handleSubmit} />
</section>
