<script lang="ts">
  import { DialogAction, getButtonText } from './dialogs.ts'

  interface Props {
    action: DialogAction
  }

  let { action }: Props = $props()
</script>

<button
  value={action}
  class="flex-1 border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-white font-bold py-2 px-4 rounded-lg transition-colors"
>
  {getButtonText(action)}
</button>