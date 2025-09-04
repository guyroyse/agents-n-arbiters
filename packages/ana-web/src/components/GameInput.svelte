<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    currentCommand?: string
    isLoading: boolean
    onSubmit: (command: string) => void
  }

  let { currentCommand = $bindable(''), isLoading, onSubmit }: Props = $props()
  let inputElement: HTMLInputElement

  function handleSubmit(event: Event) {
    event.preventDefault()

    if (!currentCommand.trim() || isLoading) return

    onSubmit(currentCommand.trim())
  }

  $effect(() => {
    if (!isLoading && inputElement) inputElement.focus()
  })
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
  <label for="command-input" class="text-redis-hyper">&gt;</label>
  <input
    id="command-input"
    bind:this={inputElement}
    bind:value={currentCommand}
    disabled={isLoading}
    placeholder="Enter command..."
    class="flex-1 bg-transparent text-redis-white outline-none placeholder-redis-dusk-30 disabled:opacity-50"
  />
</form>
