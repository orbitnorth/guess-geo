'use client'

import { Icon } from './Icons'
import { getAvatarById } from '@/lib/data/avatars'

export function DuelHud({
  p1 = {},
  p2 = {},
  timeLeft = 45,
  roundNumber = 1,
  multiplier = 1.0,
  phase = 'duel_guessing',
  onLeaveDuel,
}) {
  const p1Avatar = getAvatarById(p1.avatar)
  const p2Avatar = getAvatarById(p2.avatar)

  const p1MaxHp = p1.maxHp || 5000
  const p2MaxHp = p2.maxHp || 5000

  const p1Percent = Math.max(0, Math.min(100, ((p1.hp ?? p1MaxHp) / p1MaxHp) * 100))
  const p2Percent = Math.max(0, Math.min(100, ((p2.hp ?? p2MaxHp) / p2MaxHp) * 100))

  const isLowTime = timeLeft <= 10

  const getHpColorClass = (pct) => {
    if (pct > 55) return 'hp-green'
    if (pct > 25) return 'hp-yellow'
    return 'hp-red'
  }

  return (
    <header className="duel-hud-topbar" role="banner">
      {/* Player 1 Card (Left) */}
      <div className="duel-player-card p1-card">
        <div className="duel-avatar-wrap p1-avatar-wrap">
          <img
            src={p1Avatar.src}
            alt={p1.name || 'You'}
            width={44}
            height={44}
            className="duel-avatar-img"
          />
          {p1.isLockedIn && (
            <span className="duel-locked-badge" title="Guess Confirmed">
              <Icon name="check" size={11} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="duel-player-info">
          <div className="duel-player-meta">
            <span className="duel-name">{p1.name || 'Explorer'}</span>
            <span className="duel-you-tag">YOU</span>
          </div>

          <div className="duel-hp-track">
            <div
              className={`duel-hp-bar ${getHpColorClass(p1Percent)}`}
              style={{ width: `${p1Percent}%` }}
            />
          </div>

          <div className="duel-hp-text">
            <strong>{(p1.hp ?? p1MaxHp).toLocaleString()}</strong>
            <span> / {p1MaxHp.toLocaleString()} HP</span>
          </div>
        </div>
      </div>

      {/* Center Duel State & Timer */}
      <div className="duel-center-status">
        <div className="duel-center-top">
          <span className="duel-round-pill">
            Round {roundNumber}
          </span>
          <span className={`duel-mult-pill ${multiplier > 1.4 ? 'is-sudden-death' : ''}`}>
            {multiplier.toFixed(1)}x {multiplier >= 2 ? 'SUDDEN DEATH' : 'DMG'}
          </span>
        </div>

        <div className={`duel-timer-badge ${isLowTime ? 'is-low-time' : ''}`}>
          <Icon name="timer" size={17} strokeWidth={2.4} />
          <span className="duel-timer-val">{timeLeft}s</span>
        </div>

        <div className="duel-vs-indicator" aria-hidden="true">
          <span className="duel-vs-text">VS</span>
        </div>
      </div>

      {/* Player 2 Card (Right) */}
      <div className="duel-player-card p2-card">
        <div className="duel-player-info p2-info">
          <div className="duel-player-meta p2-meta">
            <span className="duel-opponent-tag">OPPONENT</span>
            <span className="duel-name">{p2.name || 'Rival'}</span>
          </div>

          <div className="duel-hp-track">
            <div
              className={`duel-hp-bar ${getHpColorClass(p2Percent)}`}
              style={{ width: `${p2Percent}%` }}
            />
          </div>

          <div className="duel-hp-text p2-hp-text">
            <strong>{(p2.hp ?? p2MaxHp).toLocaleString()}</strong>
            <span> / {p2MaxHp.toLocaleString()} HP</span>
          </div>
        </div>

        <div className="duel-avatar-wrap p2-avatar-wrap">
          <img
            src={p2Avatar.src}
            alt={p2.name || 'Opponent'}
            width={44}
            height={44}
            className="duel-avatar-img"
          />
          {p2.isLockedIn && (
            <span className="duel-locked-badge p2-locked-badge" title="Guess Confirmed">
              <Icon name="check" size={11} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>

      {onLeaveDuel && (
        <button
          type="button"
          className="btn-duel-quit"
          onClick={onLeaveDuel}
          aria-label="Exit Duel"
          title="Forfeit & Exit Duel"
        >
          <Icon name="close" size={16} strokeWidth={2.4} />
        </button>
      )}
    </header>
  )
}
