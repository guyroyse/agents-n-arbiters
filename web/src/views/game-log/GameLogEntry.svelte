<script lang="ts">
  import type { GameLogData } from '@api-types/response'
  import GameLogEntryHeader from './GameLogEntryHeader.svelte'
  import GameLogEntryJson from './GameLogEntryJson.svelte'
  import GameLogEntryMermaid from './GameLogEntryMermaid.svelte'
  import GameLogEntryString from './GameLogEntryString.svelte'

  interface Props {
    log: GameLogData
  }

  let { log }: Props = $props()

  const isSimpleMessage = $derived(
    log.contentType !== 'JSON' && log.contentType !== 'Mermaid' && !log.content.includes('\n')
  )
</script>

<GameLogEntryHeader
  timestamp={log.timestamp}
  prefix={log.prefix}
  content={isSimpleMessage ? log.content : undefined}
  isSimple={isSimpleMessage}
/>

{#if !isSimpleMessage}
  <div class="px-4 py-2 bg-redis-dusk">
    {#if log.contentType === 'JSON'}
      <GameLogEntryJson content={log.content} />
    {:else if log.contentType === 'Mermaid'}
      <GameLogEntryMermaid content={log.content} />
    {:else}
      <GameLogEntryString content={log.content} />
    {/if}
  </div>
{/if}
