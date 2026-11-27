'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { getAvatarById } from '@/lib/data/avatars'

export function LeaderboardModal({ isOpen, onClose }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError('')

    fetch('/api/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load leaderboard data.')
        return res.json()
      })
      .then((data) => {
        setLeaderboard(data.leaderboard || [])
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge={
        <>
          <Icon name="trophy" size={13} />
          <span>World Rankings</span>
        </>
      }
      badgeVariant="yellow"
      title="Global Leaderboard"
      subtitle="Top expeditions ranked by highest points scored across 5 rounds."
      className="leaderboard-modal"
      maxWidth={620}
    >
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="x" size={15} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="leaderboard-loading">
          <div className="loading-spinner" />
          <span>Scanning expedition records...</span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          <span className="empty-icon">🌍</span>
          <h3>No Expeditions Recorded Yet</h3>
          <p>Be the first explorer to complete all 5 rounds and claim #1 on the world ranking!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, idx) => {
            const avatar = getAvatarById(entry.userAvatar)
            const rank = idx + 1
            const isTopThree = rank <= 3
            const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
            const dateStr = entry.createdAt
              ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : ''
            const displayName = entry.userName?.trim() || 'Guest Explorer'

            return (
              <div
                key={entry.id || idx}
                className={`leaderboard-card-row${isTopThree ? ` rank-top rank-${rank}` : ''}`}
              >
                <div className="leaderboard-rank">
                  {medalEmoji ? (
                    <span className="rank-medal">{medalEmoji}</span>
                  ) : (
                    <span className="rank-num">#{rank}</span>
                  )}
                </div>

                <div className="leaderboard-user-col">
                  <div className="leaderboard-avatar-wrap">
                    <img
                      src={avatar.src}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="leaderboard-avatar-img"
                    />
                  </div>
                  <div className="leaderboard-user-details">
                    <strong className="leaderboard-user-name">{displayName}</strong>
                    <span className="leaderboard-user-meta">
                      {avatar.title} • {dateStr}
                    </span>
                  </div>
                </div>

                <div className="leaderboard-score-col">
                  <strong className="leaderboard-score-val">
                    {entry.totalScore.toLocaleString()}
                  </strong>
                  <span className="leaderboard-score-max">
                    / {entry.maxScore.toLocaleString()} pts
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="modal-footer-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
