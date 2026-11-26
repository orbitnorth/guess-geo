import { useEffect } from 'react'
import { Icon } from './Icons'

export function Lightbox({ location, roundNumber, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mystery photograph, full size"
    >
      <button
        type="button"
        className="icon-btn lightbox-close"
        onClick={onClose}
        aria-label="Close full size photo"
      >
        <Icon name="close" size={20} strokeWidth={2.2} />
      </button>

      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <img src={location.img} alt="Mystery location, full size" draggable="false" />
        <figcaption>
          <span className="tag tag-yellow">Mystery location</span>
          <span className="tag tag-blue">Round {roundNumber}</span>
        </figcaption>
      </figure>
    </div>
  )
}
