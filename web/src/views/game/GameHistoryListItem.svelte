<script lang="ts">
  import type { GameTurnData } from '@ana/types'

  interface Props {
    entry: GameTurnData
  }

  let { entry }: Props = $props()
</script>

<div class="space-y-1">
  <p class="text-redis-hyper pr-4">
    &gt; {entry.command}
  </p>
  <p class="text-redis-dusk-30 pl-2 pr-4">
    {entry.reply}
  </p>
</div>
