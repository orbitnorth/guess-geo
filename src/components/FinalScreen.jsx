import { AnimatedNumber } from './AnimatedNumber'
import { Icon } from './Icons'
import { Mascot } from './Mascot'

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

export function FinalScreen({ results, totalScore, maxTotal, onRestart }) {
  const ratio = maxTotal > 0 ? totalScore / maxTotal : 0
  const stars = ratio >= 0.78 ? 3 : ratio >= 0.45 ? 2 : 1

  return (
    <div className="overlay final-overlay" role="dialog" aria-modal="true" aria-label="Final score">
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

      <div className="final-card">
        <div className="final-mascot">
          <Mascot size={124} />
        </div>

        <span className="meta">Session complete</span>
        <h2 className="final-rating">{ratingFor(ratio)}</h2>

        <div className="final-stars" aria-label={`${stars} of 3 stars earned`}>
          {[1, 2, 3].map((slot) => (
            <span
              key={slot}
              className={`final-star${slot <= stars ? ' is-on' : ''}`}
              style={{ animationDelay: `${slot * 0.12}s` }}
            >
              <Icon name="star" size={46} />
            </span>
          ))}
        </div>

        <div className="final-score-row">
          <span className="final-score">
            <AnimatedNumber value={totalScore} duration={1400} />
          </span>
          <span className="final-max">/ {maxTotal.toLocaleString()}</span>
        </div>

        <div className="final-summary">
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

        <button type="button" className="btn btn-green btn-xl" onClick={onRestart}>
          Play again
          <Icon name="reset" size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
