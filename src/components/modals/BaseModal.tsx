import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  isOpen: boolean
  handleClose: () => void
}
export const BaseModal = ({ title, children, isOpen, handleClose }: Props) => (
  <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
    <DialogBackdrop className="fixed inset-0 bg-black/50" />
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 dark:text-white">
          <div className="flex items-center justify-between gap-4 mb-4">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={handleClose}
              className="rounded px-2 py-1 border"
            >
              Close
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </div>
  </Dialog>
)
