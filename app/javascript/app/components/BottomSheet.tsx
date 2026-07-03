import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Thumb-reachable bottom sheet for add/edit flows (S08, S10).
export function BottomSheet({
  open,
  onClose,
  children
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md rounded-t-[26px] border-t border-line bg-bg2 px-4 pb-6 pt-4 shadow-[0_-20px_40px_-20px_rgba(0,0,0,.7)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-line" />
            <div className="max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
