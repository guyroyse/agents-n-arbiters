<script lang="ts">
  import type { GameTurn } from '@ana/shared'

  interface Props {
    entry: GameTurn
  }

  let { entry }: Props = $props()
</script>

<div class="space-y-1">
  <p class="text-redis-hyper">
    &gt; {entry.command}
  </p>
  <p class="text-redis-dusk-30 pl-2">
    {entry.reply}
  </p>
</div>