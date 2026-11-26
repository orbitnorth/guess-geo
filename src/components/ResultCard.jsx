import { formatKm } from '../game/geo'
import { MAX_POINTS, TIER_LABEL } from '../data/locations'
import { Icon } from './Icons'

export function ResultCard({ result, isLast, onNext }) {
  const width = Math.max((result.points / MAX_POINTS) * 100, 3)

  return (
    <aside className="result-card" data-tier={result.tier} aria-label="Round result">
      <header className="result-head">
        <span className="tag tag-blue">The answer</span>
        <span className={`tier tier-${result.tier}`}>
          <i aria-hidden="true" />
          {TIER_LABEL[result.tier]}
        </span>
      </header>

      <h2 className="result-place">{result.name}</h2>
      <p className="result-country">{result.country}</p>

      <div className="result-distance">
        <span className="meta">Distance from your pin</span>
        <span className="result-distance-value">
          {formatKm(result.km)} <small>km</small>
        </span>
      </div>

      <div className="meter" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>

      <footer className="result-foot">
        <div className="result-points-block">
          <span className="meta">Round score</span>
          <span className="result-points">+{result.points.toLocaleString()}</span>
        </div>

        <button type="button" className="btn btn-green" onClick={onNext}>
          {isLast ? 'Final score' : 'Next round'}
          <Icon name="arrowRight" size={17} strokeWidth={2.2} />
        </button>
      </footer>
    </aside>
  )
}
