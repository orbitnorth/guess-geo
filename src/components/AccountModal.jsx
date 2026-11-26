'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'

export function AccountModal({ user, token, isOpen, onClose, onAuthSuccess, onLogout }) {
  const [tab, setTab] = useState(() => (user ? 'profile' : 'register'))
  const [avatars, setAvatars] = useState([])
  
  // Register state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('explorer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')

  // Stats & Leaderboard
  const [stats, setStats] = useState(null)
  const [myScores, setMyScores] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  // Keep tab synced with user auth status
  useEffect(() => {
    if (user) {
      setTab('profile')
      setEditName(user.name)
      setEditAvatar(user.avatar)
    } else {
      setTab('register')
    }
  }, [user])

  // Fetch avatars
  useEffect(() => {
    fetch('/api/avatars')
      .then((res) => res.json())
      .then((data) => {
        if (data.avatars) setAvatars(data.avatars)
      })
      .catch(() => {})
  }, [])

  // Fetch user stats when profile tab opens
  useEffect(() => {
    if (isOpen && user && token && tab === 'profile') {
      fetch('/api/scores/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) setStats(data.stats)
          if (data.scores) setMyScores(data.scores)
        })
        .catch(() => {})
    }
  }, [isOpen, user, token, tab])

  // Fetch leaderboard when leaderboard tab opens
  useEffect(() => {
    if (isOpen && tab === 'leaderboard') {
      fetch('/api/leaderboard')
        .then((res) => res.json())
        .then((data) => {
          if (data.leaderboard) setLeaderboard(data.leaderboard)
        })
        .catch(() => {})
    }
  }, [isOpen, tab])

  if (!isOpen) return null

  const handleRegister = async (e) => {
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

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.')
      }

      onAuthSuccess(data.user, data.token)
      setLoginEmail('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, avatar: editAvatar }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.')
      }

      onAuthSuccess(data.user, data.token)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentAvatarInfo =
    avatars.find((a) => a.id === (user ? user.avatar : selectedAvatar)) || {
      emoji: '🧭',
      name: 'Explorer',
      color: '#1cb0f6',
      bg: '#ddf4ff',
    }

  return (
    <div
      className="overlay auth-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="icon-btn auth-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Modal navigation tabs */}
        <div className="auth-tabs">
          {user ? (
            <>
              <button
                type="button"
                className={`auth-tab ${tab === 'profile' ? 'is-active' : ''}`}
                onClick={() => {
                  setTab('profile')
                  setError('')
                }}
              >
                <Icon name="user" size={16} />
                My Profile
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === 'leaderboard' ? 'is-active' : ''}`}
                onClick={() => {
                  setTab('leaderboard')
                  setError('')
                }}
              >
                <Icon name="trophy" size={16} />
                Leaderboard
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`auth-tab ${tab === 'register' ? 'is-active' : ''}`}
                onClick={() => {
                  setTab('register')
                  setError('')
                }}
              >
                Create Account
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === 'login' ? 'is-active' : ''}`}
                onClick={() => {
                  setTab('login')
                  setError('')
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === 'leaderboard' ? 'is-active' : ''}`}
                onClick={() => {
                  setTab('leaderboard')
                  setError('')
                }}
              >
                <Icon name="trophy" size={16} />
                Leaderboard
              </button>
            </>
          )}
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        {/* 1. REGISTER TAB */}
        {tab === 'register' && !user && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-header-copy">
              <h2>Join the Expedition</h2>
              <p>Create your explorer profile to save your pin drops and high scores.</p>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-name">Explorer Name</label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Amelia Earhart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Choose your Avatar Image</label>
              <div className="avatar-grid">
                {avatars.map((av) => {
                  const isSelected = selectedAvatar === av.id
                  return (
                    <button
                      key={av.id}
                      type="button"
                      className={`avatar-option ${isSelected ? 'is-selected' : ''}`}
                      style={{ '--av-color': av.color, '--av-bg': av.bg }}
                      onClick={() => setSelectedAvatar(av.id)}
                      title={`${av.name}: ${av.description}`}
                    >
                      <span className="avatar-emoji">{av.emoji}</span>
                      <span className="avatar-name">{av.name}</span>
                      {isSelected && (
                        <span className="avatar-check">
                          <Icon name="check" size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-green btn-xl auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Explorer Account'}
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setTab('login')
                  setError('')
                }}
              >
                Sign in with email
              </button>
            </p>
          </form>
        )}

        {/* 2. LOGIN TAB */}
        {tab === 'login' && !user && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-header-copy">
              <h2>Welcome Back</h2>
              <p>Enter your email address to pick up your passport and history.</p>
            </div>

            <div className="auth-field">
              <label htmlFor="login-email">Your Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@domain.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-blue btn-xl auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </button>

            <p className="auth-switch">
              Need an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setTab('register')
                  setError('')
                }}
              >
                Create one in seconds
              </button>
            </p>
          </form>
        )}

        {/* 3. PROFILE TAB */}
        {tab === 'profile' && user && (
          <div className="auth-profile-view">
            <div className="profile-hero">
              <div
                className="profile-avatar-bubble"
                style={{
                  backgroundColor: currentAvatarInfo.bg,
                  borderColor: currentAvatarInfo.color,
                }}
              >
                <span className="profile-emoji">{currentAvatarInfo.emoji}</span>
              </div>
              <div className="profile-identity">
                <h2>{user.name}</h2>
                <span className="profile-email">{user.email}</span>
                <span className="profile-tag" style={{ color: currentAvatarInfo.color }}>
                  {currentAvatarInfo.name}
                </span>
              </div>
            </div>

            {!isEditing ? (
              <>
                {/* Stats cards */}
                <div className="profile-stats-grid">
                  <div className="profile-stat-card">
                    <span className="stat-label">Games Played</span>
                    <strong className="stat-val">{stats?.gamesPlayed ?? 0}</strong>
                  </div>
                  <div className="profile-stat-card">
                    <span className="stat-label">Best Score</span>
                    <strong className="stat-val">
                      {(stats?.highestScore ?? 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="profile-stat-card">
                    <span className="stat-label">Average</span>
                    <strong className="stat-val">
                      {(stats?.averageScore ?? 0).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Score history */}
                {myScores.length > 0 && (
                  <div className="profile-history">
                    <h3>Recent Expeditions</h3>
                    <div className="history-list">
                      {myScores.slice(0, 5).map((s) => (
                        <div key={s.id} className="history-item">
                          <span className="history-date">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                          <span className="history-score">
                            +{s.totalScore.toLocaleString()} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Icon name="edit" size={15} />
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost profile-logout-btn"
                    onClick={() => {
                      onLogout()
                      onClose()
                    }}
                  >
                    <Icon name="logout" size={15} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              /* Profile Edit Form */
              <form className="auth-form" onSubmit={handleSaveProfile}>
                <div className="auth-field">
                  <label htmlFor="edit-name">Display Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>

                <div className="auth-field">
                  <label>Change Avatar</label>
                  <div className="avatar-grid">
                    {avatars.map((av) => {
                      const isSelected = editAvatar === av.id
                      return (
                        <button
                          key={av.id}
                          type="button"
                          className={`avatar-option ${isSelected ? 'is-selected' : ''}`}
                          style={{ '--av-color': av.color, '--av-bg': av.bg }}
                          onClick={() => setEditAvatar(av.id)}
                        >
                          <span className="avatar-emoji">{av.emoji}</span>
                          <span className="avatar-name">{av.name}</span>
                          {isSelected && (
                            <span className="avatar-check">
                              <Icon name="check" size={12} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="edit-btn-row">
                  <button
                    type="submit"
                    className="btn btn-green btn-md"
                    disabled={loading}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-md"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 4. LEADERBOARD TAB */}
        {tab === 'leaderboard' && (
          <div className="auth-leaderboard-view">
            <div className="auth-header-copy">
              <h2>Top Globe Explorers</h2>
              <p>Highest scores achieved across all expeditions.</p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="leaderboard-empty">No scores recorded yet. Be the first!</div>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((item, index) => {
                  const avInfo = avatars.find((a) => a.id === item.userAvatar) || {
                    emoji: '🧭',
                    color: '#1cb0f6',
                    bg: '#ddf4ff',
                  }
                  const isTop3 = index < 3
                  return (
                    <div
                      key={item.id}
                      className={`leaderboard-item ${isTop3 ? `rank-${index + 1}` : ''}`}
                    >
                      <span className="leaderboard-rank">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div
                        className="leaderboard-avatar"
                        style={{ backgroundColor: avInfo.bg }}
                      >
                        {avInfo.emoji}
                      </div>
                      <div className="leaderboard-info">
                        <strong>{item.userName || 'Anonymous Explorer'}</strong>
                        <span className="leaderboard-date">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="leaderboard-points">
                        +{item.totalScore.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
