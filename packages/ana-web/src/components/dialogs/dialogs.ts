// Dialog action types
export enum DialogAction {
  Confirm = 'confirm',
  Cancel = 'cancel',
  Retry = 'retry'
}

// Standard button text
const ButtonText = {
  [DialogAction.Confirm]: 'Confirm',
  [DialogAction.Cancel]: 'Cancel',
  [DialogAction.Retry]: 'Try Again'
} as const

export function getButtonText(action: DialogAction): string {
  return ButtonText[action]
}

interface BaseDialogProps {
  show: boolean
  title: string
  message: string
}

export interface DialogProps extends BaseDialogProps {
  buttons: DialogAction[]
  primaryButton?: DialogAction
  onAction: (action: DialogAction) => void
  onDismiss?: () => void
}

export interface ConfirmationDialogProps extends BaseDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

export interface ErrorDialogProps extends BaseDialogProps {
  onRetry: () => void
  onCancel: () => void
}
