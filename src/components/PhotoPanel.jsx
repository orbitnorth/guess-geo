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
}) {
  const frameClass = [
    'photo-frame',
    photoState === 'loading' ? 'is-loading' : '',
    photoState === 'error' ? 'is-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="photo-panel" aria-label="Mystery location photograph">
      <header className="photo-head">
        <div className="photo-meta">
          <span className="tag tag-yellow">Mystery location</span>
          <span className="photo-index">
            Round {roundNumber} of {totalRounds}
          </span>
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
          <button type="button" className="photo-expand" onClick={onExpand} aria-label="View photo full size">
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
