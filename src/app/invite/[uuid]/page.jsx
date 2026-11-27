'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Icon } from '@/components/Icons'
import { Mascot } from '@/components/Mascot'

const GeoGuessGame = dynamic(() => import('@/components/GeoGuessGame'), {
  ssr: false,
  loading: () => (
    <div className="stage-loading">
      <div className="stage-spinner" />
      <p>Entering 1v1 Duel Arena...</p>
    </div>
  ),
})

export default function InviteSubRoutePage() {
  const routeParams = useParams()
  const rawUuid = routeParams?.uuid || ''
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : String(rawUuid)).trim()

  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isPlaying) {
    return <GeoGuessGame initialDuelRoom={uuid} autoStartDuel={true} />
  }

  return (
    <div className="invite-page-wrapper">
      {/* Top Bar */}
      <header className="hero-nav invite-nav">
        <Link href="/" className="hero-brand" title="GeoGuess Home">
          <span className="brand-mark">
            <Icon name="globe" size={24} strokeWidth={2} />
          </span>
          <div className="brand-text">
            <strong>GeoGuess</strong>
          </div>
        </Link>

        <div className="hero-nav-actions">
          <Link href="/" className="hero-nav-btn">
            <Icon name="arrowLeft" size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Challenge Card */}
      <main className="invite-page-main">
        <div className="invite-card">
          <div className="invite-mascot-wrap">
            <Mascot size={88} />
          </div>

          <div className="invite-badge-pill">
            <Icon name="swords" size={14} strokeWidth={2.4} />
            <span>1v1 Globe Duel Challenge</span>
          </div>

          <h1 className="invite-title">You've Been Challenged!</h1>
          <p className="invite-subtitle">
            A friend invited you to a live 5,000 HP geography clash on the interactive 3D globe.
          </p>

          {/* Room ID Box */}
          <div className="invite-room-box">
            <div className="invite-room-details">
              <span className="invite-room-label">Room Identifier</span>
              <strong className="invite-room-id">{uuid || 'Custom Duel'}</strong>
            </div>
            <button
              type="button"
              className="btn-invite-copy"
              onClick={handleCopy}
              title="Copy shareable link"
            >
              <Icon name={copied ? 'check' : 'expand'} size={15} />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Match Highlights */}
          <div className="invite-rules-list">
            <div className="invite-rule-item">
              <span className="rule-icon">🌍</span>
              <div className="rule-copy">
                <strong>Same 7 Locations</strong>
                <span>Both players explore identical satellite coordinates and mystery views.</span>
              </div>
            </div>

            <div className="invite-rule-item">
              <span className="rule-icon">💥</span>
              <div className="rule-copy">
                <strong>Closer Pin Wins Round</strong>
                <span>The player closest to the target deals distance difference damage.</span>
              </div>
            </div>

            <div className="invite-rule-item">
              <span className="rule-icon">⏱️</span>
              <div className="rule-copy">
                <strong>15 Seconds Per Turn</strong>
                <span>Fast-paced deduction — lock in your pin before the clock expires!</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="invite-actions">
            <button
              type="button"
              className="btn btn-green btn-xl btn-full-action invite-play-btn"
              onClick={() => setIsPlaying(true)}
            >
              <Icon name="lightning" size={20} strokeWidth={2.5} />
              <span>Accept Challenge & Play Duel</span>
            </button>

            <Link href="/" className="btn btn-ghost btn-full-action invite-solo-link">
              <span>Explore Solo Instead</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
