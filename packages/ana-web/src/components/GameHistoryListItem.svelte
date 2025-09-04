<script lang="ts">
  import type { GameHistoryEntry } from '@ana/shared'

  interface Props {
    entry: GameHistoryEntry
  }

  let { entry }: Props = $props()
</script>

<div class="space-y-1">
  <p class="text-redis-hyper">
    &gt; {entry.command}
  </p>
  <p class="text-redis-dusk-30 pl-2">
    {entry.response}
  </p>
</div>