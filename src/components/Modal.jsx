'use client'

import { useEffect, useRef } from 'react'
import { Icon } from './Icons'

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  badgeVariant = 'blue',
  className = '',
  maxWidth,
  children,
}) {
  const modalRef = useRef(null)

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Close on backdrop click (outside the modal dialog)
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose?.()
    }
  }

  const badgeClass =
    badgeVariant === 'yellow'
      ? 'modal-badge-pill badge-yellow'
      : badgeVariant === 'green'
        ? 'modal-badge-pill badge-green'
        : 'modal-badge-pill'

  return (
    <div
      className="overlay modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Dialog'}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`modal-container ${className}`.trim()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {/* Fixed Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            {badge && (
              <span className={badgeClass}>
                {badge}
              </span>
            )}
            {title && <h2 className="modal-title">{title}</h2>}
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <Icon name="x" size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="modal-body custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
