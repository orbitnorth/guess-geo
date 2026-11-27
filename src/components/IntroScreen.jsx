import { Icon } from './Icons'
import { Mascot } from './Mascot'
import { getAvatarSrc } from '@/lib/data/avatars'

export function IntroScreen({
  onStart,
  onOpenDuel,
  muted,
  onToggleMute,
  user,
  onOpenRegister,
  onOpenLogin,
  onOpenLeaderboard,
  onOpenProfile,
}) {
  return (
    <div className="landing-hero" role="region" aria-label="GeoGuess Globe Expedition">
      {/* Top Navbar */}
      <header className="hero-nav">
        <div className="hero-brand">
          <span className="brand-mark">
            <Icon name="globe" size={24} strokeWidth={2} />
          </span>
          <div className="brand-text">
            <strong>GeoGuess</strong>
          </div>
        </div>

        <div className="hero-nav-actions">
          <button
            type="button"
            className="hero-nav-btn hero-duel-nav-btn"
            onClick={onOpenDuel}
            title="1v1 Battle Arena"
          >
            <Icon name="swords" size={16} />
            <span>1v1 Duel</span>
          </button>

          <button
            type="button"
            className="hero-nav-btn"
            onClick={onOpenLeaderboard}
            title="Global Leaderboard"
          >
            <Icon name="trophy" size={16} />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            className="hero-nav-btn sound-toggle-btn"
            onClick={onToggleMute}
            aria-label={muted ? 'Turn sound on' : 'Mute sound'}
            title={muted ? 'Sound muted (M)' : 'Sound on (M)'}
          >
            <Icon name={muted ? 'volumeOff' : 'volume'} size={17} strokeWidth={2.2} />
            <span className="sound-label">{muted ? 'Off' : 'On'}</span>
          </button>

          {user ? (
            <button
              type="button"
              className="hero-user-pill"
              onClick={onOpenProfile}
              title="View your explorer profile"
            >
              <img
                src={getAvatarSrc(user.avatar)}
                alt={user.name}
                width={26}
                height={26}
                className="hero-user-avatar-thumb"
              />
              <span className="hero-user-name">{user.name}</span>
            </button>
          ) : (
            <div className="hero-auth-actions">
              <button
                type="button"
                className="hero-nav-btn hero-login-btn"
                onClick={onOpenLogin}
              >
                <Icon name="user" size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className="hero-join-btn"
                onClick={onOpenRegister}
              >
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="hero-body">
        {/* Left Column: Copy & Actions */}
        <div className="hero-content">
          <h1 className="hero-title">
            Spin the globe.
            <br />
            <span className="hero-title-highlight">Find the place.</span>
          </h1>

          <p className="hero-desc">
            Five mystery photographs from across the continents. Inspect architecture, road markings, light, and natural wonders, rotate the interactive 3D WebGL globe, and plant your flag to score up to 25,000 points.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn btn-green btn-hero-start"
              onClick={onStart}
            >
              <span>Solo Expedition</span>
              <Icon name="arrowRight" size={19} strokeWidth={2.4} />
            </button>

            <button
              type="button"
              className="btn btn-hero-duel"
              onClick={onOpenDuel}
            >
              <Icon name="swords" size={18} strokeWidth={2.2} />
              <span>1v1 Duel</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-hero-secondary"
              onClick={onOpenLeaderboard}
            >
              <Icon name="trophy" size={17} />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Stage */}
        <div className="hero-stage-col">
          <div className="hero-stage-backdrop">
            <div className="orbital-ring ring-1" />
            <div className="orbital-ring ring-2" />

            {/* Floating Game Badges */}
            <div className="floating-badge badge-top-left">
              <span className="badge-pin">📍</span>
              <div className="badge-copy">
                <strong>Eiffel Tower</strong>
                <span>Paris, France</span>
              </div>
            </div>

            <div className="floating-badge badge-bottom-right">
              <span className="badge-star">⭐</span>
              <div className="badge-copy">
                <strong className="score-text">+4,985 pts</strong>
                <span>Pinpoint accuracy</span>
              </div>
            </div>

            {/* Mascot Centerpiece */}
            <div className="hero-mascot-container">
              <div className="hero-speech-bubble">
                Ready for takeoff? 🚀
              </div>
              <Mascot className="hero-mascot-visual" size={290} />
            </div>

            {/* Ambient twinkling sparkles */}
            <div className="hero-stars-layer" aria-hidden="true">
              <span className="star-dot dot-1" />
              <span className="star-dot dot-2" />
              <span className="star-dot dot-3" />
              <span className="star-dot dot-4" />
              <span className="star-dot dot-5" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
