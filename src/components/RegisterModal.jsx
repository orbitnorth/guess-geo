'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { AVATARS } from '@/lib/data/avatars'

export function RegisterModal({ isOpen, onClose, onAuthSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('felix')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatar: selectedAvatar }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.')
      }

      onAuthSuccess(data.user, data.token)
      setName('')
      setEmail('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentAvatar = AVATARS.find((a) => a.id === selectedAvatar) || AVATARS[0]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge="New Explorer"
      badgeVariant="blue"
      title="Join the Expedition"
      subtitle="Pick your cartoon avatar to start recording scores on the globe."
      className="register-modal"
    >
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="x" size={15} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="reg-name" className="form-label">
            Explorer Name
          </label>
          <input
            id="reg-name"
            type="text"
            className="form-input"
            placeholder="e.g. Amelia Earhart"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            className="form-input"
            placeholder="explorer@earth.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Avatar Selection */}
        <div className="form-group">
          <div className="avatar-section-header">
            <label className="form-label">Choose your Cartoon Avatar</label>
            <div className="current-avatar-preview">
              <img
                src={currentAvatar.src}
                alt={currentAvatar.name}
                className="preview-avatar-img"
                width={26}
                height={26}
              />
              <span className="preview-avatar-name">{currentAvatar.name}</span>
            </div>
          </div>

          <div className="cartoon-avatar-grid custom-scrollbar">
            {AVATARS.map((item) => {
              const isSelected = selectedAvatar === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`cartoon-avatar-card${isSelected ? ' is-selected' : ''}`}
                  onClick={() => setSelectedAvatar(item.id)}
                  style={{ '--avatar-accent': item.badgeColor, '--avatar-bg': item.bg }}
                >
                  <div className="cartoon-avatar-thumb">
                    <img
                      src={item.src}
                      alt={item.name}
                      width={52}
                      height={52}
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="avatar-check-badge">
                        <Icon name="check" size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="cartoon-avatar-info">
                    <strong className="cartoon-avatar-name">{item.name}</strong>
                    <span className="cartoon-avatar-title">{item.title}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-green btn-auth-submit"
          disabled={loading}
        >
          {loading ? 'Creating Explorer Profile...' : 'Create Explorer Account'}
          <Icon name="arrowRight" size={17} strokeWidth={2.4} />
        </button>
      </form>

      <div className="modal-footer-switch">
        <span>Already have an explorer account?</span>
        <button
          type="button"
          className="link-switch-btn"
          onClick={onSwitchToLogin}
        >
          Sign In here
        </button>
      </div>
    </Modal>
  )
}
