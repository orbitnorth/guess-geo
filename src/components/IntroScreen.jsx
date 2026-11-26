import { Icon } from './Icons'
import { Mascot } from './Mascot'

const STEPS = [
  {
    title: 'Study the photo',
    copy: 'Architecture, plants, road markings, light. Every detail is a clue.',
  },
  {
    title: 'Spin and drop a pin',
    copy: 'Drag the globe, zoom in, then tap the spot that feels right.',
  },
  {
    title: 'Confirm and score',
    copy: 'The closer your pin, the bigger the reward. Up to 5,000 points.',
  },
]

export function IntroScreen({ onStart, muted, onToggleMute, user, onOpenAuth }) {
  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-label="How to play">
      <div className="intro-card">
        <div className="intro-main">
          <div className="intro-top-row">
            <div className="intro-brand">
              <span className="brand-mark">
                <Icon name="globe" size={22} strokeWidth={2} />
              </span>
              <strong>GeoGuess</strong>
              <span className="meta">Globe edition</span>
            </div>

            {user ? (
              <button
                type="button"
                className="intro-user-pill"
                onClick={onOpenAuth}
                title="View your profile & leaderboard"
              >
                <Icon name="user" size={15} />
                <span>{user.name}</span>
              </button>
            ) : (
              <button
                type="button"
                className="intro-join-btn"
                onClick={onOpenAuth}
              >
                <Icon name="user" size={15} />
                <span>Sign in / Join</span>
              </button>
            )}
          </div>

          <h1 className="intro-title">
            Spin the globe.
            <br />
            <span>Find the place.</span>
          </h1>

          <p className="intro-copy">
            Five photographs from around the world. Study each scene, spin the globe and place
            your pin as close to the real location as you can.
          </p>

          <ol className="intro-steps">
            {STEPS.map((step, index) => (
              <li className="intro-step" key={step.title}>
                <span className="step-num">{index + 1}</span>
                <div className="step-body">
                  <strong>{step.title}</strong>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="intro-actions">
            <button type="button" className="btn btn-green btn-xl" onClick={onStart}>
              Start exploring
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </button>
            <button type="button" className="btn btn-ghost" onClick={onToggleMute}>
              <Icon name={muted ? 'volumeOff' : 'volume'} size={17} />
              Sound {muted ? 'off' : 'on'}
            </button>
          </div>

          <p className="intro-foot">Five rounds / 5,000 points each / 91 verified world locations</p>
        </div>

        <div className="intro-art">
          <span className="intro-bubble">Ready for takeoff?</span>
          <Mascot className="intro-mascot" />
          <div className="intro-art-dots" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  )
}
