'use client'

import { useState, useEffect } from 'react'
import { sound } from '@/audio/SoundEngine'
import { Icon } from './Icons'

const TIER_META = {
  great: {
    label: 'Bullseye!',
    icon: '🎯',
    tagClass: 'callout-tier-great',
  },
  okay: {
    label: 'Good Guess!',
    icon: '📍',
    tagClass: 'callout-tier-okay',
  },
  bad: {
    label: 'Lost in Orbit!',
    icon: '🚀',
    tagClass: 'callout-tier-bad',
  },
  duel_win: {
    label: 'Round Won!',
    icon: '⚡',
    tagClass: 'callout-tier-win',
  },
  duel_loss: {
    label: 'Round Lost!',
    icon: '💥',
    tagClass: 'callout-tier-loss',
  },
}

export function ReactionCallout({ reaction, tier = 'okay' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  // Trigger audio equalizer bounce and entrance whenever reaction changes
  useEffect(() => {
    if (reaction?.text) {
      setAnimKey((prev) => prev + 1)
      setIsPlaying(true)
      const timer = setTimeout(() => setIsPlaying(false), 2400)
      return () => clearTimeout(timer)
    }
  }, [reaction?.text])

  if (!reaction?.text) return null

  const meta = TIER_META[tier] || TIER_META.okay

  const handleReplay = (e) => {
    e?.stopPropagation()
    setIsPlaying(true)
    if (reaction.audio) {
      sound.playAudioClip(reaction.audio)
    }
    setTimeout(() => setIsPlaying(false), 2200)
  }

  return (
    <aside
      key={animKey}
      className={`reaction-callout-wrap ${meta.tagClass}`}
      role="status"
      aria-live="polite"
      onClick={handleReplay}
      title="Click to replay voice reaction"
    >
      <div className="reaction-callout-glow" aria-hidden="true" />
      <div className="reaction-callout-card">
        <header className="reaction-callout-header">
          <div className="reaction-callout-tag">
            <span className="reaction-callout-emoji">{meta.icon}</span>
            <span className="reaction-callout-label">{meta.label}</span>
          </div>

          <div
            className={`reaction-sound-eq ${isPlaying ? 'is-playing' : ''}`}
            title={isPlaying ? 'Voice playing' : 'Voice line'}
            aria-hidden="true"
          >
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
          </div>
        </header>

        <p className="reaction-callout-text">
          &ldquo;{reaction.text}&rdquo;
        </p>

        <footer className="reaction-callout-footer">
          <button
            type="button"
            className="reaction-replay-pill"
            onClick={handleReplay}
            aria-label="Replay Edge Natural Voice reaction"
          >
            <Icon name="volume" size={14} strokeWidth={2.4} />
            <span>Replay Voice</span>
          </button>
        </footer>
      </div>
    </aside>
  )
}
