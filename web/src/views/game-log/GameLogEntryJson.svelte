<script lang="ts">
  import { onMount } from 'svelte'
  import '@alenaksu/json-viewer'

  interface Props {
    content: string
  }

  let { content }: Props = $props()
  let containerElement = $state<HTMLDivElement>()
  let error = $state<string | null>(null)

  onMount(() => {
    if (!containerElement) return

    try {
      const jsonData = JSON.parse(content)
      const viewer = document.createElement('json-viewer') as any
      viewer.data = jsonData
      viewer.style.cssText = `
        --json-viewer-color-key: #ff4438;
        --json-viewer-color-string: #dcff1e;
        --json-viewer-color-number: #80dbff;
        --json-viewer-color-boolean: #c795e3;
        --json-viewer-color-null: #b2b2b2;
        --json-viewer-background: #1a1d29;
        --json-viewer-font-family: ui-monospace, monospace;
      `
      containerElement.appendChild(viewer)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Invalid JSON'
    }
  })
</script>

{#if error}
  <div class="text-red-400">Invalid JSON: {content}</div>
{:else}
  <div bind:this={containerElement}></div>
{/if}
