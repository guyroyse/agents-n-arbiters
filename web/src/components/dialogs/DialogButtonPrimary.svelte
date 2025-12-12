<script lang="ts">
  import { DialogAction, getButtonText } from './dialogs.ts'

  interface Props {
    action: DialogAction
  }

  let { action }: Props = $props()
</script>

<button
  value={action}
  class="flex-1 bg-redis-dusk hover:bg-redis-dusk-70 text-redis-white font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
>
  {getButtonText(action)}
</button>
