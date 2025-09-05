<script lang="ts">
  import Dialog from './Dialog.svelte'
  import { DialogAction, type ConfirmationDialogProps } from './dialogs.ts'

  let { show, title, message, onConfirm, onCancel }: ConfirmationDialogProps = $props()

  function handleAction(action: DialogAction) {
    switch (action) {
      case DialogAction.Confirm:
        onConfirm()
        break
      case DialogAction.Cancel:
        onCancel()
        break
    }
  }

  function handleDismiss() {
    onCancel()
  }
</script>

<Dialog
  {show}
  {title}
  {message}
  buttons={[DialogAction.Confirm, DialogAction.Cancel]}
  primaryButton={DialogAction.Confirm}
  onAction={handleAction}
  onDismiss={handleDismiss}
/>
