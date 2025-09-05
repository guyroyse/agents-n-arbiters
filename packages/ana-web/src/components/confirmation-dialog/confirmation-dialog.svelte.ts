export enum DialogResult {
  Confirm = 'confirm',
  Cancel = 'cancel'
}

export interface ConfirmationDialogProps {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}