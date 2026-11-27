'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from './Icons'
import { Modal } from './Modal'
import { getAvatarById } from '@/lib/data/avatars'
import { sound } from '@/audio/SoundEngine'

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
  const [activeTab, setActiveTab] = useState(() => (initialRoomCode ? 'join' : 'host'))
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState(initialRoomCode)
  const [inputError, setInputError] = useState('')
  const [hostRoomCode] = useState(() => generateRoomUuid())
  
  // Room synchronization state
  const [roomState, setRoomState] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [hasConnectedRoom, setHasConnectedRoom] = useState(false)

  const activeCode = activeTab === 'host' ? hostRoomCode : inputCode.trim()
  const currentRole = activeTab === 'host' ? 'host' : 'guest'
  const currentName = user?.name || (activeTab === 'host' ? 'King Explorer' : 'System Admin')
  const currentAvatar = user?.avatar || (activeTab === 'host' ? 'felix' : 'aneka')

  const channelRef = useRef(null)
  const pollTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const hasStartedRef = useRef(false)

  // Initialize or fetch room state from API
  const syncRoom = useCallback(async (codeToSync) => {
    if (!codeToSync || codeToSync.length < 3) return
    try {
      const res = await fetch(`/api/duels/${encodeURIComponent(codeToSync)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.room) {
          setRoomState(data.room)
        }
      }
    } catch {
      // Ignore network hiccup during polling
    }
  }, [])

  // Send action to room API and broadcast to other tab
  const sendRoomAction = useCallback(async (action, customCode) => {
    const targetCode = customCode || activeCode
    if (!targetCode || targetCode.length < 3) return

    try {
      const res = await fetch(`/api/duels/${encodeURIComponent(targetCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          role: currentRole,
          name: currentName,
          avatar: currentAvatar,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.room) {
          setRoomState(data.room)
          channelRef.current?.postMessage({
            type: 'ROOM_UPDATE',
            room: data.room,
            sender: currentRole,
          })
        }
      }
    } catch {
      // Ignore network hiccup
    }
  }, [activeCode, currentRole, currentName, currentAvatar])

  // Setup broadcast channel and polling for room sync
  useEffect(() => {
    if (!isOpen || !activeCode || activeCode.length < 3) return undefined

    // 1. Setup local BroadcastChannel for instant cross-tab sync
    const channelName = `guess_geo_duel_${activeCode}`
    const channel = new BroadcastChannel(channelName)
    channelRef.current = channel

    channel.onmessage = (event) => {
      if (event.data?.type === 'ROOM_UPDATE') {
        setRoomState(event.data.room)
      } else if (event.data?.type === 'START_MATCH') {
        if (!hasStartedRef.current) {
          hasStartedRef.current = true
          onStartDuel(event.data.duelParams)
        }
      }
    }

    // 2. Register presence in room
    sendRoomAction('join')

    // 3. Poll API every 1.2s for cross-device support
    pollTimerRef.current = setInterval(() => {
      syncRoom(activeCode)
    }, 1200)

    return () => {
      clearInterval(pollTimerRef.current)
      channel.close()
    }
  }, [isOpen, activeCode, sendRoomAction, syncRoom, onStartDuel])

  // Trigger match start when both players are ready
  const triggerMatchStart = useCallback((finalRoom) => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const opponentName = currentRole === 'host' ? finalRoom.guestName : finalRoom.hostName
    const opponentAvatar = currentRole === 'host' ? finalRoom.guestAvatar : finalRoom.hostAvatar

    const duelParams = {
      opponentType: 'friend',
      roomCode: activeCode,
      isHost: currentRole === 'host',
      opponentName,
      opponentAvatar,
    }

    // Broadcast to other tab
    channelRef.current?.postMessage({
      type: 'START_MATCH',
      duelParams,
    })

    // Start match for this player
    sound.roundStart?.()
    onStartDuel(duelParams)
  }, [currentRole, activeCode, onStartDuel])

  // Watch for both players becoming ready
  useEffect(() => {
    if (!roomState) return

    const bothReady = Boolean(
      roomState.hostName &&
      roomState.guestName &&
      roomState.hostReady &&
      roomState.guestReady
    )

    if (bothReady && countdown === null && !hasStartedRef.current) {
      setCountdown(3)
      sound.countdownTick?.()

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current)
            triggerMatchStart(roomState)
            return 0
          }
          sound.countdownTick?.()
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [roomState, countdown, triggerMatchStart])

  // Toggle ready status
  const handleToggleReady = async () => {
    const nextReady = !isReady
    setIsReady(nextReady)
    sound.click?.()
    await sendRoomAction(nextReady ? 'ready' : 'unready')
  }

  // Handle URL code cleaning
  const cleanAndSetCode = (val) => {
    setInputError('')
    let cleaned = val.trim()
    if (cleaned.includes('/invite/')) {
      const match = cleaned.match(/\/invite\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleaned = match[1]
    } else if (cleaned.includes('duel=')) {
      const match = cleaned.match(/duel=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleaned = match[1]
    }
    cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
    setInputCode(cleaned)
  }

  const handlePasteCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText()
        cleanAndSetCode(text)
      }
    } catch {
      // ignore
    }
  }

  const handleConnectRoom = async (e) => {
    e?.preventDefault?.()
    let code = inputCode.trim()
    if (code.includes('/invite/')) {
      const match = code.match(/\/invite\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) code = match[1]
    } else if (code.includes('duel=')) {
      const match = code.match(/duel=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) code = match[1]
    }
    code = code.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)

    if (!code || code.length < 3) {
      setInputError('Please enter a valid room code or link.')
      return
    }

    setInputCode(code)
    setHasConnectedRoom(true)
    await sendRoomAction('join', code)
    sound.click?.()
  }

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

  // Pre-fill if arrived with initial code
  useEffect(() => {
    if (initialRoomCode) {
      const cleaned = initialRoomCode.trim()
      setInputCode(cleaned)
      setActiveTab('join')
      setHasConnectedRoom(true)
    }
  }, [initialRoomCode])

  // Resolve avatars for display
  const hostAvatarData = getAvatarById(roomState?.hostAvatar || (currentRole === 'host' ? currentAvatar : 'felix'))
  const guestAvatarData = getAvatarById(roomState?.guestAvatar || (currentRole === 'guest' ? currentAvatar : 'aneka'))

  const isHostReady = Boolean(roomState?.hostReady)
  const isGuestReady = Boolean(roomState?.guestReady)
  const hasGuest = Boolean(roomState?.guestName)
  const otherPlayerName = currentRole === 'host' ? roomState?.guestName : roomState?.hostName
  const isOtherPlayerReady = currentRole === 'host' ? isGuestReady : isHostReady

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
      subtitle="Face off in a 5,000 HP clash. Both players must press Play to start!"
      maxWidth={520}
      className="duel-lobby-modal"
    >
      {/* Segmented Navigation Tabs */}
      <div className="duel-lobby-tabs" role="tablist" aria-label="1v1 Duel Modes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'host'}
          className={`duel-tab-btn tab-host ${activeTab === 'host' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('host')
            setIsReady(false)
            setInputError('')
          }}
        >
          <Icon name="sparkle" size={15} strokeWidth={2.4} />
          <span>Host & Invite</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'join'}
          className={`duel-tab-btn tab-join ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('join')
            setIsReady(false)
            setInputError('')
          }}
        >
          <Icon name="arrowRight" size={15} strokeWidth={2.4} />
          <span>Join with Code</span>
        </button>
      </div>

      {/* Host Tab Pane */}
      {activeTab === 'host' && (
        <div className="duel-tab-pane duel-action-card card-host" role="tabpanel" aria-label="Host Match">
          <div className="action-card-header">
            <span className="card-badge badge-green">Host Room</span>
            <h3 className="card-title">Invite a Friend</h3>
            <p className="card-subtitle">
              Share your invite link. Both players must press Play for the duel to begin!
            </p>
          </div>

          <div className="action-card-body">
            <div className="card-input-row">
              <input
                type="text"
                readOnly
                value={getInviteUrl()}
                title={getInviteUrl()}
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

            {/* Players Status Strip */}
            <div className="duel-players-strip">
              <div className="duel-player-chip is-host">
                <div className="player-avatar-circle">
                  <img src={hostAvatarData.src} alt={roomState?.hostName || currentName} />
                </div>
                <div className="player-chip-info">
                  <span className="player-chip-name">{roomState?.hostName || currentName} (You)</span>
                  <span className={`player-chip-status ${isHostReady ? 'ready' : 'waiting'}`}>
                    {isHostReady ? '✓ Ready' : '• Not Ready'}
                  </span>
                </div>
              </div>

              <span className="duel-vs-badge">VS</span>

              <div className="duel-player-chip is-guest">
                <div className="player-chip-info">
                  <span className="player-chip-name">{roomState?.guestName || 'Waiting...'}</span>
                  <span className={`player-chip-status ${isGuestReady ? 'ready' : 'waiting'}`}>
                    {hasGuest ? (isGuestReady ? '✓ Ready' : '• Joined') : '• Waiting for friend'}
                  </span>
                </div>
                <div className="player-avatar-circle">
                  <img src={guestAvatarData.src} alt={roomState?.guestName || 'Guest'} />
                </div>
              </div>
            </div>

            {/* Status & Alert Banners */}
            {countdown !== null ? (
              <div className="duel-sync-alert alert-ready" role="status">
                <Icon name="lightning" size={16} strokeWidth={2.4} />
                <span>Both players ready! Match starting in {countdown}s...</span>
              </div>
            ) : isOtherPlayerReady && !isReady ? (
              <div className="duel-sync-alert alert-call-action" role="alert">
                <Icon name="sparkle" size={16} strokeWidth={2.4} />
                <span><strong>{otherPlayerName}</strong> is READY! Click Play below to start!</span>
              </div>
            ) : isReady && !isOtherPlayerReady ? (
              <div className="duel-sync-alert alert-waiting" role="status">
                <Icon name="hourglass" size={16} strokeWidth={2.4} />
                <span>Waiting for {otherPlayerName || 'your friend'} to click Play... (1/2 Ready)</span>
              </div>
            ) : null}

            {/* Play / Ready Button */}
            <button
              type="button"
              className={`btn btn-full-action card-action-btn ${isReady ? 'btn-ghost' : 'btn-green'}`}
              onClick={handleToggleReady}
            >
              <Icon name={isReady ? 'check' : 'lightning'} size={18} strokeWidth={2.5} />
              <span>
                {isReady
                  ? '✓ You are Ready! (Waiting for opponent...)'
                  : isOtherPlayerReady
                  ? 'Start Match with Ready Opponent!'
                  : 'Play & Get Ready'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Join Tab Pane */}
      {activeTab === 'join' && (
        <div className="duel-tab-pane duel-action-card card-join" role="tabpanel" aria-label="Join Match">
          <div className="action-card-header">
            <span className="card-badge badge-blue">Join Room</span>
            <h3 className="card-title">Join with Code</h3>
            <p className="card-subtitle">
              Enter or paste a room code. Both players must press Play to start!
            </p>
          </div>

          <div className="action-card-body">
            <div className="card-input-row">
              <input
                type="text"
                className="friend-code-input"
                placeholder="Paste code or link..."
                value={inputCode}
                onChange={(e) => cleanAndSetCode(e.target.value)}
                maxLength={80}
                aria-label="Friend room code or link"
                autoFocus
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

            {/* Players Status Strip */}
            <div className="duel-players-strip">
              <div className="duel-player-chip is-host">
                <div className="player-avatar-circle">
                  <img src={hostAvatarData.src} alt={roomState?.hostName || 'Host'} />
                </div>
                <div className="player-chip-info">
                  <span className="player-chip-name">{roomState?.hostName || 'Host'}</span>
                  <span className={`player-chip-status ${isHostReady ? 'ready' : 'waiting'}`}>
                    {isHostReady ? '✓ Ready' : '• In Room'}
                  </span>
                </div>
              </div>

              <span className="duel-vs-badge">VS</span>

              <div className="duel-player-chip is-guest">
                <div className="player-chip-info">
                  <span className="player-chip-name">{roomState?.guestName || currentName} (You)</span>
                  <span className={`player-chip-status ${isGuestReady ? 'ready' : 'waiting'}`}>
                    {isGuestReady ? '✓ Ready' : '• Not Ready'}
                  </span>
                </div>
                <div className="player-avatar-circle">
                  <img src={guestAvatarData.src} alt={roomState?.guestName || currentName} />
                </div>
              </div>
            </div>

            {/* Status & Alert Banners */}
            {countdown !== null ? (
              <div className="duel-sync-alert alert-ready" role="status">
                <Icon name="lightning" size={16} strokeWidth={2.4} />
                <span>Both players ready! Match starting in {countdown}s...</span>
              </div>
            ) : isOtherPlayerReady && !isReady ? (
              <div className="duel-sync-alert alert-call-action" role="alert">
                <Icon name="sparkle" size={16} strokeWidth={2.4} />
                <span><strong>{otherPlayerName || 'Host'}</strong> is READY! Click Play below to start!</span>
              </div>
            ) : isReady && !isOtherPlayerReady ? (
              <div className="duel-sync-alert alert-waiting" role="status">
                <Icon name="hourglass" size={16} strokeWidth={2.4} />
                <span>Waiting for {otherPlayerName || 'Host'} to click Play... (1/2 Ready)</span>
              </div>
            ) : null}

            {/* Connect / Ready Button */}
            {!hasConnectedRoom && !roomState?.guestName ? (
              <button
                type="button"
                className="btn btn-blue btn-full-action card-action-btn"
                onClick={handleConnectRoom}
              >
                <Icon name="arrowRight" size={17} strokeWidth={2.5} />
                <span>Connect to Room</span>
              </button>
            ) : (
              <button
                type="button"
                className={`btn btn-full-action card-action-btn ${isReady ? 'btn-ghost' : 'btn-blue'}`}
                onClick={handleToggleReady}
              >
                <Icon name={isReady ? 'check' : 'lightning'} size={18} strokeWidth={2.5} />
                <span>
                  {isReady
                    ? '✓ You are Ready! (Waiting for Host...)'
                    : isOtherPlayerReady
                    ? 'Start Match with Ready Host!'
                    : 'Play & Get Ready'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
