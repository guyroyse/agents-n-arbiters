<script lang="ts">
  import { DialogAction, type DialogProps } from './dialogs.ts'
  import DialogButtonPrimary from './DialogButtonPrimary.svelte'
  import DialogButtonSecondary from './DialogButtonSecondary.svelte'

  let { show, title, message, buttons, primaryButton, onAction, onDismiss }: DialogProps = $props()

  let dialog: HTMLDialogElement

  $effect(() => {
    if (dialog && show) dialog.showModal()
  })

  function handleClose() {
    const action = dialog.returnValue as DialogAction
    if (action && buttons.includes(action)) {
      onAction(action)
    } else {
      // Handle dismissal (ESC key, programmatic close, etc.)
      onDismiss?.()
    }
  }
</script>

<dialog
  bind:this={dialog}
  onclose={handleClose}
  class="backdrop:bg-black/50 bg-redis-midnight border-2 border-redis-dusk-10 rounded-lg p-6 max-w-md mx-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
>
  <h2 class="text-redis-white font-bold text-lg mb-4">{title}</h2>
  <p class="text-redis-dusk-30 mb-6">
    {@html message}
  </p>
  <form method="dialog" class="flex space-x-3">
    {#each buttons as action}
      {#if action === primaryButton}
        <DialogButtonPrimary {action} />
      {:else}
        <DialogButtonSecondary {action} />
      {/if}
    {/each}
  </form>
</dialog>