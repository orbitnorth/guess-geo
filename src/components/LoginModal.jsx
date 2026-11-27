'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'

export function LoginModal({ isOpen, onClose, onAuthSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge="Existing Explorer"
      badgeVariant="blue"
      title="Welcome Back"
      subtitle="Sign in with your registered email to continue your expedition."
      className="login-modal"
      maxWidth={480}
    >
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
    </Modal>
  )
}
