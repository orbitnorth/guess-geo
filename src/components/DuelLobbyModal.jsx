'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { DUEL_BOTS } from '@/game/duelBots'
import { getAvatarById } from '@/lib/data/avatars'

export function DuelLobbyModal({
  isOpen,
  onClose,
  onStartDuel,
  user,
}) {
  const [selectedBotId, setSelectedBotId] = useState('aneka')
  const [tab, setTab] = useState('bot') // 'bot' | 'friend'
  const [copied, setCopied] = useState(false)
  const [friendRoomCode] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase())

  const selectedBot = DUEL_BOTS.find((b) => b.id === selectedBotId) || DUEL_BOTS[1]

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?duel=${friendRoomCode}`
      navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStart = () => {
    onStartDuel({
      opponentType: tab,
      bot: selectedBot,
      roomCode: friendRoomCode,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge={
        <>
          <Icon name="swords" size={13} strokeWidth={2.4} />
          <span>1v1 Battle Arena</span>
        </>
      }
      badgeVariant="blue"
      title="1v1 Globe Duel"
      subtitle="Face off in a 5,000 HP clash. Closer pin deals distance damage each round!"
      maxWidth={540}
      className="duel-lobby-modal"
      footer={
        <button
          type="button"
          className="btn-modal-action btn-full-action btn-duel-start-action"
          onClick={handleStart}
        >
          <Icon name="lightning" size={18} strokeWidth={2.4} />
          <span>Start 1v1 Duel</span>
        </button>
      }
    >
      {/* Mode Tabs */}
      <div className="duel-lobby-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'bot'}
          className={`duel-tab-btn ${tab === 'bot' ? 'is-active' : ''}`}
          onClick={() => setTab('bot')}
        >
          <Icon name="compass" size={16} />
          <span>Instant Match (Bot)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friend'}
          className={`duel-tab-btn ${tab === 'friend' ? 'is-active' : ''}`}
          onClick={() => setTab('friend')}
        >
          <Icon name="user" size={16} />
          <span>Play Friend</span>
        </button>
      </div>

      {tab === 'bot' ? (
        <div className="duel-bot-selection">
          <span className="lobby-section-label">Select Your Opponent</span>
          <div className="duel-bot-list">
            {DUEL_BOTS.map((bot) => {
              const avatar = getAvatarById(bot.avatar)
              const isSelected = selectedBot.id === bot.id

              return (
                <button
                  key={bot.id}
                  type="button"
                  className={`duel-bot-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedBotId(bot.id)}
                >
                  <div className="bot-card-avatar">
                    <img src={avatar.src} alt={bot.name} width={46} height={46} />
                  </div>

                  <div className="bot-card-info">
                    <div className="bot-card-title-row">
                      <strong className="bot-name">{bot.name}</strong>
                      <span className={`bot-diff-badge badge-${bot.badgeVariant || 'green'}`}>
                        {bot.difficulty}
                      </span>
                    </div>
                    <span className="bot-title">{bot.title}</span>
                    <p className="bot-desc">{bot.desc}</p>
                  </div>

                  {isSelected && (
                    <span className="bot-check-badge">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="duel-friend-section">
          <span className="lobby-section-label">Invite Code & Link</span>
          <p className="friend-info-desc">
            Share this link or 4-letter room code with a friend. Both players will receive the exact same photos!
          </p>

          <div className="friend-code-box">
            <span className="code-label">Room Code:</span>
            <strong className="code-value">{friendRoomCode}</strong>
          </div>

          <div className="friend-share-row">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/?duel=${friendRoomCode}` : ''}
              className="friend-share-input"
            />
            <button
              type="button"
              className="btn-copy-code"
              onClick={handleCopy}
            >
              <Icon name={copied ? 'check' : 'expand'} size={15} />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
