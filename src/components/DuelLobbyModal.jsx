'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'

function generateRoomUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function DuelLobbyModal({
  isOpen,
  onClose,
  onStartDuel,
  user,
  initialRoomCode = '',
}) {
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState(initialRoomCode)
  const [inputError, setInputError] = useState('')
  const [hostRoomCode] = useState(() => generateRoomUuid())

  useEffect(() => {
    if (initialRoomCode) {
      setInputCode(initialRoomCode.trim())
    }
  }, [initialRoomCode])

  const getInviteUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invite/${hostRoomCode}`
    }
    return `/invite/${hostRoomCode}`
  }

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      const url = getInviteUrl()
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
    // If a subroute invite link is pasted: e.g. http://localhost:3000/invite/uuid
    if (cleaned.includes('/invite/')) {
      const match = cleaned.match(/\/invite\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        cleaned = match[1]
      }
    } else if (cleaned.includes('duel=')) {
      // Support legacy ?duel=CODE query params
      const match = cleaned.match(/duel=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        cleaned = match[1]
      }
    }
    // Allow alphanumeric and hyphens (standard UUID format)
    cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
    setInputCode(cleaned)
  }

  const handleHostStart = () => {
    onStartDuel({
      opponentType: 'friend',
      roomCode: hostRoomCode,
      isHost: true,
    })
  }

  const handleJoinStart = (e) => {
    e?.preventDefault?.()
    const code = inputCode.trim()
    if (!code || code.length < 2) {
      setInputError('Please enter or paste a valid room code or link.')
      return
    }
    onStartDuel({
      opponentType: 'friend',
      roomCode: code,
      isHost: false,
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
      subtitle="Face off in a 5,000 HP clash. Both players receive the exact same mystery photos!"
      maxWidth={620}
      className="duel-lobby-modal"
    >
      <div className="duel-lobby-split-grid">
        {/* Left Card: Create / Invite Friend */}
        <div className="duel-action-card card-host">
          <div className="action-card-header">
            <span className="card-badge badge-green">Host</span>
            <h3 className="card-title">Invite a Friend</h3>
            <p className="card-subtitle">
              Share your room invite link. Both of you will explore identical locations.
            </p>
          </div>

          <div className="card-input-row">
            <input
              type="text"
              readOnly
              value={getInviteUrl()}
              className="friend-share-input"
              aria-label="Your invite link"
            />
            <button
              type="button"
              className="btn-copy-code"
              onClick={handleCopy}
              title="Copy share link"
            >
              <Icon name={copied ? 'check' : 'expand'} size={14} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-green btn-full-action card-action-btn"
            onClick={handleHostStart}
          >
            <Icon name="lightning" size={17} strokeWidth={2.5} />
            <span>Start Match as Host</span>
          </button>
        </div>

        {/* Right Card: Join with Code */}
        <div className="duel-action-card card-join">
          <div className="action-card-header">
            <span className="card-badge badge-blue">Join</span>
            <h3 className="card-title">Join with Code</h3>
            <p className="card-subtitle">
              Enter or paste a room UUID or invite link received from your friend.
            </p>
          </div>

          <form onSubmit={handleJoinStart} className="card-form">
            <div className="card-input-row">
              <input
                type="text"
                className="friend-code-input"
                placeholder="Paste code or link..."
                value={inputCode}
                onChange={(e) => cleanAndSetCode(e.target.value)}
                maxLength={80}
                aria-label="Friend room code or link"
              />
              <button
                type="button"
                className="btn-paste-code"
                onClick={handlePasteCode}
                title="Paste from clipboard"
              >
                <Icon name="edit" size={14} />
                <span>Paste</span>
              </button>
            </div>

            {inputError && (
              <div className="friend-code-error" role="alert">
                <Icon name="x" size={13} />
                <span>{inputError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-blue btn-full-action card-action-btn"
            >
              <Icon name="arrowRight" size={17} strokeWidth={2.5} />
              <span>Join Duel Match</span>
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}
