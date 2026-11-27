'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/Icons'
import { Mascot } from '@/components/Mascot'

export default function InviteRootPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = (e) => {
    e.preventDefault()
    let cleaned = code.trim()
    if (cleaned.includes('/invite/')) {
      const match = cleaned.match(/\/invite\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleaned = match[1]
    } else if (cleaned.includes('duel=')) {
      const match = cleaned.match(/duel=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleaned = match[1]
    }
    cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '')

    if (!cleaned) {
      setError('Please enter a valid room code or UUID')
      return
    }

    router.push(`/invite/${cleaned}`)
  }

  return (
    <div className="invite-page-wrapper">
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

      <main className="invite-page-main">
        <div className="invite-card">
          <div className="invite-mascot-wrap">
            <Mascot size={80} />
          </div>

          <div className="invite-badge-pill">
            <Icon name="swords" size={14} strokeWidth={2.4} />
            <span>1v1 Duel Invite Gateway</span>
          </div>

          <h1 className="invite-title">Join a 1v1 Globe Duel</h1>
          <p className="invite-subtitle">
            Enter or paste the room UUID or invite link you received from a friend to start battling:
          </p>

          <form onSubmit={handleJoin} className="invite-root-form">
            <div className="friend-input-wrapper">
              <input
                type="text"
                className="friend-code-input"
                placeholder="Paste /invite/[uuid] or code..."
                value={code}
                onChange={(e) => {
                  setError('')
                  setCode(e.target.value)
                }}
                autoFocus
              />
            </div>

            {error && (
              <div className="friend-code-error" role="alert" style={{ marginTop: '8px' }}>
                <Icon name="x" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-green btn-xl btn-full-action"
              style={{ marginTop: '16px' }}
            >
              <Icon name="lightning" size={18} strokeWidth={2.4} />
              <span>Go to Duel Room</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
