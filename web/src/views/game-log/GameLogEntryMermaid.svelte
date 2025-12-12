<script lang="ts">
  import { onMount } from 'svelte'
  import mermaid from 'mermaid'

  interface Props {
    content: string
  }

  let { content }: Props = $props()
  let containerElement = $state<HTMLDivElement>()
  let error = $state<string | null>(null)
  let isRendering = $state(true)

  // Initialize Mermaid with dark theme
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'ui-monospace, monospace'
  })

  onMount(async () => {
    if (!containerElement) return

    try {
      const { svg } = await mermaid.render(`diagram-${Date.now()}`, content)
      containerElement.innerHTML = svg
      isRendering = false
    } catch (err: any) {
      error = err.message || 'Failed to render diagram'
      isRendering = false
    }
  })
</script>

{#if error}
  <div class="text-red-400 bg-red-900/20 p-4 rounded">
    <strong>Invalid Mermaid Diagram:</strong><br />
    <code class="text-xs">{error}</code><br /><br />
    <strong>Content:</strong><br />
    <pre class="text-xs mt-2 overflow-auto">{content}</pre>
  </div>
{:else}
  <div bind:this={containerElement} class="mermaid-diagram flex justify-center">
    {#if isRendering}
      <div class="text-redis-dusk-30">Rendering diagram...</div>
    {/if}
  </div>
{/if}
