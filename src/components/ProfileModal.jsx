'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { AVATARS, getAvatarById } from '@/lib/data/avatars'

export function ProfileModal({ user, token, isOpen, onClose, onAuthSuccess, onLogout }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Stats and history
  const [stats, setStats] = useState(null)
  const [myScores, setMyScores] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    if (user) {
      setEditName(user.name)
      setEditAvatar(user.avatar)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user && token) {
      setLoadingStats(true)
      fetch('/api/scores/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) setStats(data.stats)
          if (data.scores) setMyScores(data.scores)
        })
        .catch(() => {})
        .finally(() => {
          setLoadingStats(false)
        })
    }
  }, [isOpen, user, token])

  const currentAvatar = user ? getAvatarById(user.avatar) : AVATARS[0]
  const chosenEditAvatar = getAvatarById(editAvatar)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setEditLoading(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, avatar: editAvatar }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server returned error (${res.status}).`)
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.')
      }

      onAuthSuccess(data.user, token)
      setIsEditing(false)
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge="Explorer Passport"
      badgeVariant="green"
      title={isEditing ? 'Edit Profile' : 'Explorer Profile'}
      subtitle="Your personal passport, stats, and recorded expeditions."
      className="profile-modal"
      maxWidth={600}
    >
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="x" size={15} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert auth-alert-success" role="alert">
          <Icon name="check" size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="profile-content">
          {/* User Hero Badge */}
          <div className="profile-hero-card">
            <div className="profile-hero-avatar">
              <img
                src={currentAvatar.src}
                alt={user?.name || 'Explorer'}
                width={68}
                height={68}
              />
            </div>
            <div className="profile-hero-info">
              <strong className="profile-hero-name">{user?.name}</strong>
              <span className="profile-hero-title">{currentAvatar.title}</span>
              <span className="profile-hero-email">@{user?.username || 'explorer'}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Avatar
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span className="stat-label">Games Played</span>
              <strong className="stat-number">{stats?.gamesPlayed || 0}</strong>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">Top Score</span>
              <strong className="stat-number stat-highlight">
                {stats?.bestScore?.toLocaleString() || 0}
              </strong>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">Average Score</span>
              <strong className="stat-number">{stats?.avgScore?.toLocaleString() || 0}</strong>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">Total Points</span>
              <strong className="stat-number">{stats?.totalPoints?.toLocaleString() || 0}</strong>
            </div>
          </div>

          {/* Expedition History */}
          <div className="profile-history-section">
            <h3 className="section-title">Recent Expeditions</h3>
            {loadingStats ? (
              <div className="leaderboard-loading">
                <div className="loading-spinner" />
                <span>Loading history...</span>
              </div>
            ) : myScores.length === 0 ? (
              <div className="history-empty">
                <span>🗺️</span>
                <p>No completed games yet. Start an expedition to see your records here!</p>
              </div>
            ) : (
              <div className="history-list">
                {myScores.slice(0, 5).map((score) => {
                  const dateStr = new Date(score.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const pct = Math.round((score.totalScore / (score.maxScore || 25000)) * 100)
                  return (
                    <div key={score.id} className="history-row">
                      <div className="history-left">
                        <span className="history-badge">5 Rounds</span>
                        <span className="history-date">{dateStr}</span>
                      </div>
                      <div className="history-right">
                        <strong className="history-score">
                          {score.totalScore.toLocaleString()} pts
                        </strong>
                        <span className="history-pct">{pct}% precision</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="profile-actions-bar">
            <button
              type="button"
              className="btn btn-outline btn-logout"
              onClick={() => {
                onLogout()
                onClose()
              }}
            >
              Log Out
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        /* Profile Edit Form */
        <form onSubmit={handleSaveProfile} className="auth-form profile-edit-form">
          <div className="form-group">
            <label htmlFor="edit-name" className="form-label">
              Explorer Name
            </label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              maxLength={40}
            />
          </div>

          <div className="form-group">
            <div className="avatar-section-header">
              <label className="form-label">Select Cartoon Avatar</label>
              <div className="current-avatar-preview">
                <img
                  src={chosenEditAvatar.src}
                  alt={chosenEditAvatar.name}
                  width={26}
                  height={26}
                />
                <span className="preview-avatar-name">{chosenEditAvatar.name}</span>
              </div>
            </div>

            <div className="cartoon-avatar-grid custom-scrollbar">
              {AVATARS.map((item) => {
                const isSelected = editAvatar === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`cartoon-avatar-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setEditAvatar(item.id)}
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

          <div className="edit-form-buttons">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-green"
              disabled={editLoading}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
