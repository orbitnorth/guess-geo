'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { DUEL_BOTS } from '@/game/duelBots'
import { getAvatarById } from '@/lib/data/avatars'

export function DuelLobbyModal({
  isOpen,
  onClose,
  onStartDuel,
  user,
  initialRoomCode = '',
}) {
  const [selectedBotId, setSelectedBotId] = useState('aneka')
  const [tab, setTab] = useState(() => (initialRoomCode ? 'friend' : 'bot')) // 'bot' | 'friend'
  const [friendSubTab, setFriendSubTab] = useState(() => (initialRoomCode ? 'join' : 'host')) // 'join' | 'host'
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState(initialRoomCode)
  const [inputError, setInputError] = useState('')
  const [hostRoomCode] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase())

  useEffect(() => {
    if (initialRoomCode) {
      setTab('friend')
      setFriendSubTab('join')
      setInputCode(initialRoomCode.toUpperCase().trim())
    }
  }, [initialRoomCode])

  const selectedBot = DUEL_BOTS.find((b) => b.id === selectedBotId) || DUEL_BOTS[1]

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?duel=${hostRoomCode}`
      navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePasteCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText()
        cleanAndSetCode(text)
      }
    } catch {
      // clipboard access denied, ignore
    }
  }

  const cleanAndSetCode = (val) => {
    setInputError('')
    let cleaned = val.trim()
    // If a full URL is pasted (e.g. http://localhost:3000/?duel=3CJ4), extract query param
    if (cleaned.includes('duel=')) {
      const match = cleaned.match(/duel=([a-zA-Z0-9]+)/)
      if (match && match[1]) {
        cleaned = match[1]
      }
    }
    // Keep max 6 uppercase characters
    cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
    setInputCode(cleaned)
  }

  const handleStart = () => {
    if (tab === 'bot') {
      onStartDuel({
        opponentType: 'bot',
        bot: selectedBot,
        roomCode: null,
      })
      return
    }

    if (friendSubTab === 'join') {
      const code = inputCode.trim().toUpperCase()
      if (!code || code.length < 2) {
        setInputError('Please enter a valid room code (e.g. 3CJ4)')
        return
      }
      onStartDuel({
        opponentType: 'friend',
        bot: selectedBot,
        roomCode: code,
        isHost: false,
      })
    } else {
      onStartDuel({
        opponentType: 'friend',
        bot: selectedBot,
        roomCode: hostRoomCode,
        isHost: true,
      })
    }
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
          <span>
            {tab === 'bot'
              ? 'Start 1v1 Bot Duel'
              : friendSubTab === 'join'
                ? `Join Duel with Code (${inputCode || '...'})`
                : `Start Match as Host (${hostRoomCode})`}
          </span>
        </button>
      }
    >
      {/* Primary Mode Tabs */}
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
          {/* Sub-selector: Join vs Host */}
          <div className="friend-action-selector">
            <button
              type="button"
              className={`friend-pill-choice ${friendSubTab === 'join' ? 'is-active' : ''}`}
              onClick={() => {
                setFriendSubTab('join')
                setInputError('')
              }}
            >
              <Icon name="arrowRight" size={14} strokeWidth={2.4} />
              <span>Join with Code</span>
            </button>

            <button
              type="button"
              className={`friend-pill-choice ${friendSubTab === 'host' ? 'is-active' : ''}`}
              onClick={() => {
                setFriendSubTab('host')
                setInputError('')
              }}
            >
              <Icon name="plus" size={14} strokeWidth={2.4} />
              <span>Create / Host Room</span>
            </button>
          </div>

          {/* JOIN SUB-VIEW */}
          {friendSubTab === 'join' && (
            <div className="friend-join-box">
              <span className="lobby-section-label">Paste or Enter Friend's Code</span>
              <p className="friend-info-desc">
                Got a 4-letter room code or link from a friend? Enter it below to join their exact mystery duel:
              </p>

              <div className="friend-input-wrapper">
                <input
                  type="text"
                  className="friend-code-input"
                  placeholder="e.g. 3CJ4"
                  value={inputCode}
                  onChange={(e) => cleanAndSetCode(e.target.value)}
                  maxLength={120}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-paste-code"
                  onClick={handlePasteCode}
                  title="Paste from clipboard"
                >
                  <Icon name="edit" size={15} />
                  <span>Paste</span>
                </button>
              </div>

              {inputError && (
                <div className="friend-code-error" role="alert">
                  <Icon name="x" size={14} />
                  <span>{inputError}</span>
                </div>
              )}
            </div>
          )}

          {/* HOST SUB-VIEW */}
          {friendSubTab === 'host' && (
            <div className="friend-host-box">
              <span className="lobby-section-label">Your Room Code & Link</span>
              <p className="friend-info-desc">
                Share this code or link with a friend so they can join you. Both players will receive the exact same mystery photos!
              </p>

              <div className="friend-code-box">
                <span className="code-label">Room Code:</span>
                <strong className="code-value">{hostRoomCode}</strong>
              </div>

              <div className="friend-share-row">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/?duel=${hostRoomCode}` : ''}
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
        </div>
      )}
    </Modal>
  )
}
