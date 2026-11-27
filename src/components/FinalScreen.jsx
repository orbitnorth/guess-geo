'use client'

import { AnimatedNumber } from './AnimatedNumber'
import { Icon } from './Icons'
import { Mascot } from './Mascot'
import { Modal } from './Modal'

const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#7ed957']

const CONFETTI = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 43 + 7) % 100}%`,
  delay: `${(index % 9) * 0.24}s`,
  duration: `${2.6 + (index % 5) * 0.35}s`,
  drift: `${((index % 7) - 3) * 20}px`,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  rotate: `${(index * 53) % 360}deg`,
}))

function ratingFor(ratio) {
  if (ratio >= 0.78) return 'Globe legend'
  if (ratio >= 0.45) return 'World traveler'
  return 'Trail starter'
}

export function FinalScreen({
  results,
  totalScore,
  maxTotal,
  onRestart,
  scoreSaved,
  user,
  onOpenLeaderboard,
}) {
  const ratio = maxTotal > 0 ? totalScore / maxTotal : 0
  const stars = ratio >= 0.78 ? 3 : ratio >= 0.45 ? 2 : 1

  return (
    <>
      <div className="confetti" aria-hidden="true">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="confetti-piece"
            style={{
              left: piece.left,
              background: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              '--drift': piece.drift,
              '--rotate': piece.rotate,
            }}
          />
        ))}
      </div>

      <Modal
        isOpen={true}
        onClose={onRestart}
        badge="Session Complete"
        badgeVariant="green"
        title={ratingFor(ratio)}
        subtitle="Expedition complete • All 5 world sites scored"
        className="final-screen-modal"
        maxWidth={480}
        footer={
          <div className="final-modal-footer">
            <button
              type="button"
              className="btn btn-green btn-final-play"
              onClick={onRestart}
            >
              <span>Play again</span>
              <Icon name="reset" size={17} strokeWidth={2.4} />
            </button>

            {onOpenLeaderboard && (
              <button
                type="button"
                className="btn btn-ghost btn-final-lead"
                onClick={onOpenLeaderboard}
              >
                <Icon name="trophy" size={16} />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        }
      >
        <div className="final-screen-content">
          <div className="final-screen-mascot-wrap">
            <Mascot size={82} />
          </div>

          <div className="final-screen-stars" aria-label={`${stars} of 3 stars earned`}>
            {[1, 2, 3].map((slot) => (
              <span
                key={slot}
                className={`final-screen-star${slot <= stars ? ' is-on' : ''}`}
                style={{ animationDelay: `${slot * 0.12}s` }}
              >
                <Icon name="star" size={32} />
              </span>
            ))}
          </div>

          <div className="final-screen-score-row">
            <span className="final-screen-score">
              <AnimatedNumber value={totalScore} duration={1200} />
            </span>
            <span className="final-screen-max">/ {maxTotal.toLocaleString()}</span>
          </div>

          {user && scoreSaved && (
            <div className="score-saved-badge">
              <Icon name="check" size={13} strokeWidth={3} />
              <span>Score recorded to {user.name}&apos;s profile</span>
            </div>
          )}

          <div className="final-screen-summary">
            {results.map((result, index) => (
              <div className="summary-row" key={`${result.name}-${index}`}>
                <span className="summary-index">{index + 1}</span>
                <span className="summary-name">{result.name}</span>
                <span className={`summary-points tier-${result.tier}`}>
                  +{result.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}
