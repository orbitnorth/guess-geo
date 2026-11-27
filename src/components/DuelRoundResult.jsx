'use client'

import { Icon } from './Icons'
import { getAvatarById } from '@/lib/data/avatars'

export function DuelRoundResult({
  result,
  p1 = {},
  p2 = {},
  isMatchOver = false,
  onNext,
}) {
  if (!result) return null

  const p1Avatar = getAvatarById(p1.avatar)
  const p2Avatar = getAvatarById(p2.avatar)

  const isP1Win = result.winner === 'p1'
  const isP2Win = result.winner === 'p2'
  const isTie = result.winner === 'tie'

  return (
    <div className="duel-result-panel" role="region" aria-label="Round Duel Outcome">
      {/* Dynamic Outcome Banner */}
      <div className={`duel-result-banner ${isP1Win ? 'banner-win' : isP2Win ? 'banner-loss' : 'banner-tie'}`}>
        <div className="banner-icon-wrap">
          {isP1Win && <Icon name="lightning" size={20} strokeWidth={2.4} />}
          {isP2Win && <Icon name="heart" size={20} strokeWidth={2.4} />}
          {isTie && <Icon name="target" size={20} strokeWidth={2.4} />}
        </div>
        <div className="banner-text-wrap">
          <strong className="banner-headline">
            {isP1Win && `You dealt ${result.p2Damage.toLocaleString()} DMG!`}
            {isP2Win && `${p2.name || 'Opponent'} dealt ${result.p1Damage.toLocaleString()} DMG!`}
            {isTie && 'Stalemate! No damage taken.'}
          </strong>
          <span className="banner-subtext">
            {isP1Win && `Closer by ${result.diffKm.toLocaleString()} km • Multiplier ${result.multiplier}x applied`}
            {isP2Win && `Farther by ${result.diffKm.toLocaleString()} km • Multiplier ${result.multiplier}x applied`}
            {isTie && 'Both players placed pins at identical distances!'}
          </span>
        </div>
      </div>

      {/* Side-by-side Distance Comparison */}
      <div className="duel-comparison-grid">
        <div className={`duel-player-stat ${isP1Win ? 'is-winner' : ''}`}>
          <div className="stat-avatar-badge">
            <img src={p1Avatar.src} alt={p1.name} width={34} height={34} />
          </div>
          <div className="stat-details">
            <span className="stat-name">{p1.name || 'You'}</span>
            <strong className="stat-distance">{result.p1Km.toLocaleString()} km</strong>
          </div>
          {isP1Win && <span className="stat-tag tag-hit">WINNER</span>}
        </div>

        <div className="duel-comparison-divider">
          <span className="divider-vs">VS</span>
        </div>

        <div className={`duel-player-stat ${isP2Win ? 'is-winner' : ''}`}>
          <div className="stat-avatar-badge">
            <img src={p2Avatar.src} alt={p2.name} width={34} height={34} />
          </div>
          <div className="stat-details">
            <span className="stat-name">{p2.name || 'Opponent'}</span>
            <strong className="stat-distance">{result.p2Km.toLocaleString()} km</strong>
          </div>
          {isP2Win && <span className="stat-tag tag-hit">WINNER</span>}
        </div>
      </div>

      {/* Advance Action */}
      <button
        type="button"
        className="btn btn-blue btn-full-action btn-duel-advance"
        onClick={onNext}
        autoFocus
      >
        <span>{isMatchOver ? 'See Match Outcome' : 'Next Duel Round'}</span>
        <Icon name="arrowRight" size={17} strokeWidth={2.5} />
      </button>
    </div>
  )
}
