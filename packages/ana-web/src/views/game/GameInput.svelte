<script lang="ts">
  import GameViewModel from './game-view-model.svelte.ts'

  interface Props {
    viewModel: GameViewModel
  }

  let { viewModel }: Props = $props()

  let inputElement: HTMLInputElement

  function handleSubmit(event: Event) {
    event.preventDefault()
    viewModel.submitCommand()
  }

  $effect(() => {
    if (!viewModel.isLoading && inputElement) inputElement.focus()
  })
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
  <label for="command-input" class="text-redis-hyper">&gt;</label>
  <input
    id="command-input"
    bind:this={inputElement}
    bind:value={viewModel.currentCommand}
    disabled={viewModel.isLoading}
    placeholder="Enter command..."
    class="flex-1 bg-transparent text-redis-white outline-none placeholder-redis-dusk-30 disabled:opacity-50"
  />
</form>
