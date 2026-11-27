'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { AVATARS } from '@/lib/data/avatars'

export function RegisterModal({ isOpen, onClose, onAuthSuccess, onSwitchToLogin }) {
  const [step, setStep] = useState(1) // 1: Credentials, 2: Avatar

  // Step 1 fields
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 field
  const [selectedAvatar, setSelectedAvatar] = useState('felix')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Support browser back button navigating from Step 2 to Step 1
  useEffect(() => {
    if (!isOpen || step !== 2) return

    window.history.pushState({ modalStep: 2 }, '')

    const handlePopState = () => {
      setStep(1)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, step])

  const handleNextStep = (e) => {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanUsername = username.trim().toLowerCase()

    if (cleanName.length < 2) {
      setError('Please enter your full explorer name (at least 2 characters).')
      return
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.')
      return
    }

    if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, dots, and underscores.')
      return
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.')
      return
    }

    // Proceed to Step 2
    setStep(2)
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          avatar: selectedAvatar,
        }),
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server returned error (${res.status}). Please try again.`)
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.')
      }

      onAuthSuccess(data.user, data.token)
      setName('')
      setUsername('')
      setPassword('')
      setStep(1)
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
      onClose={() => {
        setStep(1)
        setError('')
        onClose()
      }}
      onBack={
        step === 2
          ? () => {
              setError('')
              setStep(1)
            }
          : undefined
      }
      title={step === 1 ? 'Create Account' : 'Pick your Avatar'}
      subtitle={
        step === 1
          ? 'Enter your name, unique username, and password to start.'
          : 'Choose the cartoon adventurer that represents you on the globe.'
      }
      className="register-modal"
      maxWidth={540}
      footer={
        step === 1 ? (
          <div className="modal-footer-inner">
            <button
              type="submit"
              form="register-step1-form"
              className="btn btn-green btn-step-continue"
            >
              <span>Choose Avatar</span>
              <Icon name="arrowRight" size={18} strokeWidth={2.4} />
            </button>

            <div className="modal-footer-switch">
              <span>Already have an account?</span>
              <button
                type="button"
                className="link-switch-btn"
                onClick={() => {
                  setStep(1)
                  onSwitchToLogin()
                }}
              >
                Sign In here
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-footer-inner step-2-buttons">
            <button
              type="button"
              className="btn btn-ghost btn-step-back"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setError('')
                setStep(1)
              }}
              disabled={loading}
            >
              ← Back
            </button>

            <button
              type="submit"
              form="register-step2-form"
              className="btn btn-green btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating Explorer Account...' : 'Complete & Start Exploring'}
              <Icon name="check" size={18} strokeWidth={2.6} />
            </button>
          </div>
        )
      }
    >
      {/* Onboarding Step Indicator */}
      <div className="onboarding-stepper" aria-label={`Onboarding Step ${step} of 2`}>
        <button
          type="button"
          className={`step-dot-wrap${step >= 1 ? ' is-active' : ''}`}
          onClick={() => {
            if (step === 2) {
              setError('')
              setStep(1)
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: step === 2 ? 'pointer' : 'default',
            padding: 0,
          }}
          title={step === 2 ? 'Return to Step 1: Credentials' : 'Step 1: Credentials'}
        >
          <span className="step-num">1</span>
          <span className="step-label">Credentials</span>
        </button>
        <div className={`step-line${step === 2 ? ' is-active' : ''}`} />
        <div className={`step-dot-wrap${step === 2 ? ' is-active' : ''}`}>
          <span className="step-num">2</span>
          <span className="step-label">Avatar</span>
        </div>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="x" size={15} />
          <span>{error}</span>
        </div>
      )}

      {step === 1 ? (
        /* STEP 1: Account Credentials */
        <form id="register-step1-form" onSubmit={handleNextStep} className="auth-step-form">
          <div className="form-fields-stack">
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Explorer Full Name
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
              <label htmlFor="reg-username" className="form-label">
                Username
              </label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">@</span>
                <input
                  id="reg-username"
                  type="text"
                  className="form-input input-with-prefix"
                  placeholder="amelia_explorer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  required
                  maxLength={24}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <span className="field-hint">Unique handle for your score ranking</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Password
              </label>
              <div className="input-password-wrap">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input input-password-field"
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
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
          </div>
        </form>
      ) : (
        /* STEP 2: Choose Cartoon Avatar */
        <form id="register-step2-form" onSubmit={handleFinalSubmit} className="auth-step-form">
          <div className="avatar-step-container">
            {/* Active Avatar Highlight Banner */}
            <div className="selected-avatar-banner">
              <div className="banner-avatar-thumb">
                <img
                  src={currentAvatar.src}
                  alt={currentAvatar.name}
                  width={46}
                  height={46}
                />
              </div>
              <div className="banner-avatar-meta">
                <strong className="banner-avatar-name">{currentAvatar.name}</strong>
                <span className="banner-avatar-title">{currentAvatar.title}</span>
                <span className="banner-avatar-desc">{currentAvatar.description}</span>
              </div>
            </div>

            {/* 16 Avatar Grid */}
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
        </form>
      )}
    </Modal>
  )
}
