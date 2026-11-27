'use client'

import { useEffect, useRef } from 'react'
import { Icon } from './Icons'

export function Modal({
  isOpen,
  onClose,
  onBack,
  title,
  subtitle,
  badge,
  badgeVariant = 'blue',
  className = '',
  maxWidth,
  children,
  footer,
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
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
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
      onClick={handleOverlayClick}
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`modal-container ${className}`.trim()}
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Fixed Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            {onBack && (
              <button
                type="button"
                className="modal-header-back-btn"
                onClick={onBack}
                aria-label="Go back to previous step"
                title="Go back"
              >
                <Icon name="arrowLeft" size={17} strokeWidth={2.6} />
              </button>
            )}
            <div className="modal-title-group">
              {badge && (
                <span className={badgeClass}>
                  {badge}
                </span>
              )}
              {title && <h2 className="modal-title">{title}</h2>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
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

        {/* Fixed Modal Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
