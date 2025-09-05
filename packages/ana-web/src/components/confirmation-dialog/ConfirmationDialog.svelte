<script lang="ts">
  import { DialogResult, type ConfirmationDialogProps } from './confirmation-dialog.svelte.ts'

  let {
    show,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
  }: ConfirmationDialogProps = $props()

  let dialog: HTMLDialogElement

  $effect(() => {
    if (dialog && show) dialog.showModal()
  })

  function handleClose() {
    switch (dialog.returnValue) {
      case DialogResult.Confirm:
        onConfirm()
        break
      case DialogResult.Cancel:
        onCancel()
        break
      default:
        // Handle unexpected return value (ESC key, programmatic close, etc.)
        onCancel()
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
    <button
      value={DialogResult.Confirm}
      class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
    >
      {confirmText}
    </button>
    <button
      value={DialogResult.Cancel}
      class="flex-1 border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-white font-bold py-2 px-4 rounded-lg transition-colors"
    >
      {cancelText}
    </button>
  </form>
</dialog>
