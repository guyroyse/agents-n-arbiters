<script lang="ts">
  interface Props {
    content: string
  }

  let { content }: Props = $props()

  const isMultiline = $derived(content.includes('\n'))
</script>

{#if isMultiline}
  <div class="bg-redis-midnight p-4 rounded">
    <pre class="text-redis-white whitespace-pre-wrap font-mono text-sm">{content}</pre>
  </div>
{:else}
  <div class="bg-redis-midnight px-4 py-2 rounded">
    <span class="text-redis-white font-mono text-sm">{content}</span>
  </div>
{/if}
