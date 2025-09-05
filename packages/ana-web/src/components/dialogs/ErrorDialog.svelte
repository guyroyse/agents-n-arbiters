<script lang="ts">
  import Dialog from './Dialog.svelte'
  import { DialogAction, type ErrorDialogProps } from './dialogs.ts'

  let { show, title, message, onRetry, onCancel }: ErrorDialogProps = $props()

  function handleAction(action: DialogAction) {
    switch (action) {
      case DialogAction.Retry:
        onRetry()
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
  buttons={[DialogAction.Retry, DialogAction.Cancel]}
  primaryButton={DialogAction.Retry}
  onAction={handleAction}
  onDismiss={handleDismiss}
/>
