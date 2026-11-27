'use client'

import { Icon } from './Icons'
import { Modal } from './Modal'
import { Mascot } from './Mascot'
import { getAvatarById } from '@/lib/data/avatars'

const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff']

const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 47 + 11) % 100}%`,
  delay: `${(i % 7) * 0.22}s`,
  duration: `${2.4 + (i % 5) * 0.3}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))

export function DuelGameOverModal({
  isOpen,
  isWinner,
  p1 = {},
  p2 = {},
  roundsPlayed = 1,
  onRematch,
  onExit,
}) {
  const p1Avatar = getAvatarById(p1.avatar)
  const p2Avatar = getAvatarById(p2.avatar)

  return (
    <>
      {isWinner && (
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((item, idx) => (
            <span
              key={idx}
              className="confetti-piece"
              style={{
                left: item.left,
                background: item.color,
                animationDelay: item.delay,
                animationDuration: item.duration,
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onExit}
        badge={
          <>
            <Icon name={isWinner ? 'trophy' : 'swords'} size={13} strokeWidth={2.4} />
            <span>{isWinner ? 'Victory Achieved' : 'Duel Ended'}</span>
          </>
        }
        badgeVariant={isWinner ? 'yellow' : 'coral'}
        title={isWinner ? 'DUEL VICTORY!' : 'DUEL DEFEAT'}
        subtitle={
          isWinner
            ? `Outstanding navigation! You conquered the duel in ${roundsPlayed} rounds.`
            : `Close battle! Opponent depleted your HP in ${roundsPlayed} rounds.`
        }
        maxWidth={480}
        className="duel-gameover-modal"
        footer={
          <div className="final-modal-footer">
            <button
              type="button"
              className="btn btn-green btn-final-play"
              onClick={onRematch}
            >
              <Icon name="reset" size={17} strokeWidth={2.4} />
              <span>Rematch Duel</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-final-lead"
              onClick={onExit}
            >
              <span>Back to Menu</span>
            </button>
          </div>
        }
      >
        <div className="duel-gameover-content">
          <div className="duel-mascot-wrap">
            <Mascot size={78} />
          </div>

          {/* Winner Showcase */}
          <div className={`duel-champion-card ${isWinner ? 'win-card' : 'loss-card'}`}>
            <div className="champion-avatar-wrap">
              <img
                src={isWinner ? p1Avatar.src : p2Avatar.src}
                alt={isWinner ? p1.name : p2.name}
                width={56}
                height={56}
              />
            </div>
            <div className="champion-meta">
              <span className="champion-tag">WINNER</span>
              <strong className="champion-name">
                {isWinner ? (p1.name || 'You') : (p2.name || 'Opponent')}
              </strong>
              <span className="champion-hp">
                HP Remaining:{' '}
                <strong>
                  {(isWinner ? (p1.hp || 0) : (p2.hp || 0)).toLocaleString()} / 5,000
                </strong>
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
