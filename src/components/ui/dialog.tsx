'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Dialog Component Props
 */
export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether dialog is open */
  open?: boolean;
  /** Callback when close button clicked */
  onClose?: () => void;
}

/**
 * Dialog Atom Component
 *
 * Modal dialog component
 *
 * @example
 * ```tsx
 * <Dialog open={true} onClose={() => setOpen(false)}>
 *   <h2>Dialog Title</h2>
 *   <p>Dialog content</p>
 * </Dialog>
 * ```
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ open = false, onClose, className = '', children, ...props }, ref) => {
    if (!open) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          role="presentation"
        />

        {/* Dialog */}
        <div
          ref={ref}
          className={`
            fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            bg-white rounded-lg shadow-2xl max-w-md w-full mx-4
            z-50 p-6
            ${className}
          `
            .replace(/\s+/g, ' ')
            .trim()}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              aria-label="Close dialog"
            >
              ✕
            </button>
          )}
          {children}
        </div>
      </>
    );
  }
);

Dialog.displayName = 'Dialog';

