'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GlobeEngine } from '@/game/GlobeEngine'
import { distanceKm } from '@/game/geo'
import {
  buildDeck,
  MAX_POINTS,
  MAX_TOTAL,
  scoreForDistance,
  tierForPoints,
} from '@/data/locations'
import { sound } from '@/audio/SoundEngine'
import { AnimatedNumber } from './AnimatedNumber'
import { FinalScreen } from './FinalScreen'
import { Icon } from './Icons'
import { IntroScreen } from './IntroScreen'
import { Lightbox } from './Lightbox'
import { PhotoPanel } from './PhotoPanel'
import { ResultCard } from './ResultCard'
import { RegisterModal } from './RegisterModal'
import { LoginModal } from './LoginModal'
import { LeaderboardModal } from './LeaderboardModal'
import { ProfileModal } from './ProfileModal'
import { SettingsModal } from './SettingsModal'
import { getAvatarById } from '@/lib/data/avatars'

export default function GeoGuessGame() {
  const [deck, setDeck] = useState(() => buildDeck())
  const [roundIndex, setRoundIndex] = useState(0)
  const [phase, setPhase] = useState('intro') // intro | guessing | revealing | result | final
  const [guess, setGuess] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [results, setResults] = useState([])
  const [totalScore, setTotalScore] = useState(0)
  const [photoState, setPhotoState] = useState('loading')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [muted, setMuted] = useState(() => sound.isMuted)
  const [isTouch, setIsTouch] = useState(false)

  // Auth & Modal state: null | 'register' | 'login' | 'leaderboard' | 'profile' | 'settings'
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  const [scoreSaved, setScoreSaved] = useState(false)

  // Appearance & Texture Settings
  const [theme, setTheme] = useState('light')
  const [globeTexture, setGlobeTexture] = useState('day')

  const stageRef = useRef(null)
  const confirmRef = useRef(null)
  const scoreRef = useRef(null)
  const engineRef = useRef(null)
  const pendingTierRef = useRef(null)
  const callbacksRef = useRef({})

  const location = deck[roundIndex]
  const isLastRound = roundIndex >= deck.length - 1

  // Detect touch on mount
  useEffect(() => {
    setIsTouch(window.matchMedia?.('(pointer: coarse)').matches ?? false)
  }, [])

  // Restore settings and theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('geoguess_theme') || 'light'
    const savedTexture = localStorage.getItem('geoguess_globe_texture') || 'day'
    setTheme(savedTheme)
    setGlobeTexture(savedTexture)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  // Restore authenticated session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('guess_geo_token')
    if (savedToken) {
      setToken(savedToken)
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user)
          } else {
            localStorage.removeItem('guess_geo_token')
            setToken(null)
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleAuthSuccess = (newUser, newToken) => {
    setUser(newUser)
    setToken(newToken)
    localStorage.setItem('guess_geo_token', newToken)
    sound.fanfare?.()
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('guess_geo_token')
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('geoguess_theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    sound.click?.()
  }

  const handleGlobeTextureChange = (newTexture) => {
    setGlobeTexture(newTexture)
    localStorage.setItem('geoguess_globe_texture', newTexture)
    engineRef.current?.setTexture(newTexture)
    sound.click?.()
  }

  // ------------------------------------------------------------------
  //  THREE.JS LIFECYCLE
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!stageRef.current) return undefined

    const initialTexture =
      typeof window !== 'undefined'
        ? localStorage.getItem('geoguess_globe_texture') || 'day'
        : 'day'

    const engine = new GlobeEngine(stageRef.current, {
      initialTexture,
      onPick: (latLon) => callbacksRef.current.onPick?.(latLon),
      onRevealComplete: () => callbacksRef.current.onRevealComplete?.(),
      onFlagScreen: (info) => callbacksRef.current.onFlagScreen?.(info),
    })

    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // ------------------------------------------------------------------
  //  GAME FLOW
  // ------------------------------------------------------------------
  const handlePick = useCallback(({ lat, lon }) => {
    engineRef.current?.setGuess(lat, lon)
    setGuess({ lat, lon })
    sound.pin()
  }, [])

  const handleRevealComplete = useCallback(() => {
    const tier = pendingTierRef.current || 'okay'
    sound.result(tier)
    setPhase('result')
  }, [])

  const handleFlagScreen = useCallback((info) => {
    const button = confirmRef.current
    if (!button) return

    if (!info || !info.visible) {
      button.style.visibility = 'hidden'
      return
    }

    button.style.left = `${info.x}px`
    button.style.top = `${info.y}px`
    button.style.visibility = 'visible'
  }, [])

  callbacksRef.current = {
    onPick: handlePick,
    onRevealComplete: handleRevealComplete,
    onFlagScreen: handleFlagScreen,
  }

  const handleStart = () => {
    sound.unlock()
    sound.start()
    setPhase('guessing')
    engineRef.current?.startRound()
  }

  const handleConfirm = useCallback(() => {
    if (!guess || phase !== 'guessing' || !location) return

    const km = distanceKm(guess.lat, guess.lon, location.lat, location.lon)
    const points = scoreForDistance(km)
    const tier = tierForPoints(points)
    const result = { ...location, km, points, tier, guess }

    pendingTierRef.current = tier
    setRoundResult(result)
    setResults((previous) => [...previous, result])
    setTotalScore((previous) => previous + points)
    setPhase('revealing')

    engineRef.current?.reveal(location)

    sound.confirm()
    sound.pop(0.5)
    sound.arc(0.55, 1.5)
  }, [guess, phase, location])

  const handleNext = useCallback(() => {
    sound.click()

    if (roundIndex >= deck.length - 1) {
      setPhase('final')
      sound.fanfare()

      // Automatically post final score to backend API
      fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          totalScore,
          maxScore: MAX_TOTAL,
          roundsPlayed: deck.length,
          details: results,
        }),
      })
        .then((res) => {
          if (res.ok) setScoreSaved(true)
        })
        .catch(() => {})

      return
    }

    const nextIndex = roundIndex + 1
    setRoundIndex(nextIndex)
    setRoundResult(null)
    setGuess(null)
    setPhotoState('loading')
    setPhase('guessing')
    engineRef.current?.startRound()
    sound.roundStart()
  }, [roundIndex, deck.length, token, totalScore, results])

  const handleRestart = useCallback(() => {
    const nextDeck = buildDeck(deck.map((item) => item.id))

    setDeck(nextDeck)
    setRoundIndex(0)
    setRoundResult(null)
    setResults([])
    setTotalScore(0)
    setGuess(null)
    setPhotoState('loading')
    setLightboxOpen(false)
    setPhase('guessing')
    setScoreSaved(false)
    pendingTierRef.current = null

    engineRef.current?.startRound()
    sound.start()
  }, [deck])

  const toggleMute = useCallback(() => {
    const next = !sound.isMuted
    sound.setMuted(next)
    setMuted(next)
    if (!next) sound.click()
  }, [])

  // Reset photo skeleton when round changes
  useEffect(() => {
    setPhotoState('loading')
  }, [roundIndex, deck])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (event.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null)
          return
        }
        setLightboxOpen(false)
        return
      }

      if (event.key.toLowerCase() === 'm' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        toggleMute()
        return
      }

      if (event.key === 'Enter' && phase === 'guessing' && guess) {
        event.preventDefault()
        handleConfirm()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, guess, handleConfirm, toggleMute, activeModal])

  // Small pulse when total score updates
  useEffect(() => {
    const node = scoreRef.current
    if (!node || totalScore === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    node.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.04)' },
        { transform: 'scale(1)' },
      ],
      { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' },
    )
  }, [totalScore])

  const openLightbox = () => {
    sound.click()
    setLightboxOpen(true)
  }

  const hint =
    phase === 'revealing'
      ? 'Revealing the answer. Watch the route on the globe.'
      : phase === 'result'
        ? 'Round complete. Continue when you are ready.'
        : guess
          ? isTouch
            ? 'Pin placed. Tap confirm, or tap elsewhere to move it.'
            : 'Pin placed. Adjust it, or confirm with Enter.'
          : isTouch
            ? 'Drag to rotate. Pinch to zoom. Tap the globe to drop your pin.'
            : 'Drag to rotate. Scroll to zoom. Click the globe to drop your pin.'

  const userAvatar = user ? getAvatarById(user.avatar) : null

  return (
    <div className="app">
      <div className="stage" ref={stageRef} />

      {phase !== 'intro' && (
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="globe" size={23} strokeWidth={2} />
            </span>
            <div className="brand-text">
              <strong>GeoGuess</strong>
              <span className="meta">Globe edition</span>
            </div>
          </div>

          <div className="round-block" aria-label={`Round ${roundIndex + 1} of ${deck.length}`}>
            <div className="round-track" aria-hidden="true">
              {deck.map((item, index) => {
                const done = index < roundIndex || phase === 'final'
                const current = index === roundIndex && phase !== 'final'
                return (
                  <span
                    key={item.id}
                    className={`round-dot${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}
                  >
                    {done ? <Icon name="check" size={15} strokeWidth={3} /> : index + 1}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="topbar-right">
            {/* User Account / Profile Button */}
            {user ? (
              <button
                type="button"
                className="user-pill-btn"
                onClick={() => setActiveModal('profile')}
                title="View your explorer profile & stats"
              >
                <img
                  src={userAvatar?.src || '/avatars/felix.svg'}
                  alt={user.name}
                  width={22}
                  height={22}
                  style={{ borderRadius: '50%', display: 'block' }}
                />
                <span className="user-pill-name">{user.name}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-ghost user-join-btn"
                onClick={() => setActiveModal('register')}
              >
                <Icon name="user" size={16} />
                <span>Join / Sign In</span>
              </button>
            )}

            <div className="score-block" aria-label="Current score">
              <span className="score-star">
                <Icon name="star" size={17} />
              </span>
              <span className="score-value" ref={scoreRef}>
                <AnimatedNumber value={totalScore} />
              </span>
            </div>

            <button
              type="button"
              className="sound-btn"
              onClick={toggleMute}
              aria-label={muted ? 'Turn sound on' : 'Mute sound'}
              aria-pressed={!muted}
              title={muted ? 'Turn sound on (M)' : 'Mute sound (M)'}
            >
              <Icon name={muted ? 'volumeOff' : 'volume'} size={19} strokeWidth={2.2} />
            </button>
          </div>
        </header>
      )}

      {phase !== 'intro' && (
        <PhotoPanel
          location={location}
          photoState={photoState}
          hint={hint}
          roundNumber={roundIndex + 1}
          totalRounds={deck.length}
          onLoad={() => setPhotoState('ready')}
          onError={() => setPhotoState('error')}
          onExpand={openLightbox}
        />
      )}

      {phase !== 'intro' && (
        <div className="map-controls" aria-label="Globe controls">
          <button
            type="button"
            onClick={() => engineRef.current?.zoom(0.82)}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Icon name="plus" size={19} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.zoom(1.22)}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Icon name="minus" size={19} strokeWidth={2.4} />
          </button>
          <span className="map-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={() => engineRef.current?.resetView()}
            aria-label="Reset globe view"
            title="Reset view"
          >
            <Icon name="compass" size={19} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {phase === 'guessing' && guess && (
        <button
          type="button"
          ref={confirmRef}
          className="confirm-btn"
          onClick={handleConfirm}
        >
          <Icon name="check" size={14} strokeWidth={2.2} />
          Confirm guess
          <kbd>Enter</kbd>
        </button>
      )}

      {phase === 'result' && roundResult && (
        <ResultCard result={roundResult} isLast={isLastRound} onNext={handleNext} />
      )}

      {phase === 'final' && (
        <FinalScreen
          results={results}
          totalScore={totalScore}
          maxTotal={MAX_TOTAL}
          onRestart={handleRestart}
          scoreSaved={scoreSaved}
          user={user}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
        />
      )}

      {phase === 'intro' && (
        <IntroScreen
          onStart={handleStart}
          muted={muted}
          onToggleMute={toggleMute}
          user={user}
          onOpenRegister={() => setActiveModal('register')}
          onOpenLogin={() => setActiveModal('login')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenProfile={() => setActiveModal('profile')}
        />
      )}

      {lightboxOpen && location && (
        <Lightbox
          location={location}
          roundNumber={roundIndex + 1}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Distinct, Unmerged Modals */}
      <RegisterModal
        isOpen={activeModal === 'register'}
        onClose={() => setActiveModal(null)}
        onAuthSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setActiveModal('login')}
      />

      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={() => setActiveModal(null)}
        onAuthSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setActiveModal('register')}
      />

      <LeaderboardModal
        isOpen={activeModal === 'leaderboard'}
        onClose={() => setActiveModal(null)}
      />

      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        user={user}
        token={token}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      {/* Floating Settings Button in bottom-right corner */}
      <button
        type="button"
        className="btn-settings-corner"
        onClick={() => setActiveModal('settings')}
        aria-label="Game Settings"
        title="Settings & Appearance"
      >
        <Icon name="settings" size={24} strokeWidth={2.2} />
      </button>

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        theme={theme}
        onThemeChange={handleThemeChange}
        globeTexture={globeTexture}
        onGlobeTextureChange={handleGlobeTextureChange}
      />
    </div>
  )
}
