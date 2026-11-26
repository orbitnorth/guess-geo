'use client'

import { useState } from 'react'
import { Icon } from './Icons'

export function LoginModal({ isOpen, onClose, onAuthSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.')
      }

      onAuthSuccess(data.user, data.token)
      setEmail('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay modal-overlay" role="dialog" aria-modal="true" aria-label="Sign In">
      <div className="account-modal login-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-pill">Existing Explorer</span>
            <h2 className="modal-title">Welcome Back</h2>
            <p className="modal-subtitle">Sign in with your registered email to continue your expedition.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <Icon name="x" size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Registered Email
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="explorer@earth.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-blue btn-auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In to Expedition'}
            <Icon name="arrowRight" size={17} strokeWidth={2.4} />
          </button>
        </form>

        <div className="modal-footer-switch">
          <span>Need a new explorer account?</span>
          <button
            type="button"
            className="link-switch-btn"
            onClick={onSwitchToRegister}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}
