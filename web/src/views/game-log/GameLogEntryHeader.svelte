<script lang="ts">
  interface Props {
    timestamp: number
    prefix?: string
    content?: string
    isSimple?: boolean
  }

  let { timestamp, prefix, content, isSimple = false }: Props = $props()

  function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString()
  }
</script>

<div class={isSimple ? 'py-1 px-4 text-sm font-mono' : 'bg-redis-midnight py-1 px-4 text-sm font-mono'}>
  <span class="text-redis-hyper">{formatTimestamp(timestamp)}</span>
  {#if prefix}
    <span class="text-redis-white ml-2">{prefix}</span>
  {/if}
  {#if isSimple && content}
    <span class="text-redis-white ml-2">{content}</span>
  {/if}
</div>

