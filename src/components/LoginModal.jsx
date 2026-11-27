'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'

export function LoginModal({ isOpen, onClose, onAuthSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.')
      }

      onAuthSuccess(data.user, data.token)
      setUsername('')
      setPassword('')
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
      onClose={() => {
        setError('')
        onClose()
      }}
      badge="Existing Explorer"
      badgeVariant="blue"
      title="Welcome Back"
      subtitle="Sign in with your username and password to continue your expedition."
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
          <label htmlFor="login-username" className="form-label">
            Username
          </label>
          <div className="input-prefix-wrap">
            <span className="input-prefix">@</span>
            <input
              id="login-username"
              type="text"
              className="form-input input-with-prefix"
              placeholder="amelia_explorer"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            Password
          </label>
          <div className="input-password-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input input-password-field"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
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
