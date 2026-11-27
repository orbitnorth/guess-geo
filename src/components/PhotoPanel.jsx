'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'

export function PhotoPanel({
  location,
  photoState,
  onLoad,
  onError,
  onExpand,
  hint,
  roundNumber,
  totalRounds,
  collapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  const toggleCollapse = () => {
    if (externalToggleCollapse) {
      externalToggleCollapse(!isCollapsed)
    } else {
      setInternalCollapsed(!isCollapsed)
    }
  }

  // When round changes, default to expanded so player can inspect the new location
  useEffect(() => {
    setInternalCollapsed(false)
  }, [roundNumber])

  const frameClass = [
    'photo-frame',
    photoState === 'loading' ? 'is-loading' : '',
    photoState === 'error' ? 'is-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (isCollapsed) {
    return (
      <aside className="photo-panel is-minimized" aria-label="Mystery location preview">
        <button
          type="button"
          className="photo-minimized-card"
          onClick={toggleCollapse}
          aria-label="Expand mystery photo"
          title="Tap to view mystery photo"
        >
          <div className="minimized-thumb-wrap">
            <img src={location.img} alt="" className="minimized-thumb" draggable="false" />
            <span className="minimized-chevron-badge">
              <Icon name="chevronUp" size={13} strokeWidth={2.8} />
            </span>
          </div>
          <div className="minimized-info">
            <span className="minimized-tag">R{roundNumber}/{totalRounds}</span>
            <strong className="minimized-title">View Photo</strong>
          </div>
          <span className="minimized-tap-hint">Tap to expand</span>
        </button>
      </aside>
    )
  }

  return (
    <section className="photo-panel" aria-label="Mystery location photograph">
      <header className="photo-head">
        <div className="photo-meta">
          <span className="tag tag-yellow">Mystery location</span>
          <span className="photo-index">
            Round {roundNumber} of {totalRounds}
          </span>
          <button
            type="button"
            className="photo-collapse-btn"
            onClick={toggleCollapse}
            aria-label="Minimize photo to view globe"
            title="Minimize photo (view globe)"
          >
            <Icon name="chevronDown" size={16} strokeWidth={2.6} />
            <span className="collapse-btn-text">Globe</span>
          </button>
        </div>
        <h2 className="photo-title">Where was this taken?</h2>
      </header>

      <div className={frameClass}>
        <img
          className="photo-backdrop"
          src={location.img}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
        <img
          key={location.id}
          className="photo-img"
          src={location.img}
          alt="Photograph of an unidentified location"
          draggable="false"
          onLoad={onLoad}
          onError={onError}
        />

        {photoState === 'ready' && (
          <button type="button" className="photo-expand" onClick={onExpand} aria-label="View photo full size" title="Full size photo">
            <Icon name="expand" size={16} strokeWidth={2.2} />
          </button>
        )}

        {photoState === 'error' && (
          <div className="photo-error" role="status">
            <Icon name="image" size={24} />
            <strong>Photograph unavailable</strong>
            <span>The image could not be loaded. Continue to the next round.</span>
          </div>
        )}
      </div>

      <footer className="photo-foot">
        <span className="photo-hint">{hint}</span>
      </footer>
    </section>
  )
}
