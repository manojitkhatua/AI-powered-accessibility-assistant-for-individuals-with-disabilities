/**
 * VisionX — Hands-Free Assist Page
 * Voice-first accessibility interface
 * READY → LISTENING → PROCESSING → RESPONSE
 *
 * Frontend UI only.
 * All backend/AI integration points are marked with // BACKEND REQUIRED.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import './HandsFreeAssistPage.css'

/* ============================================================
   Constants
   ============================================================ */

const VOICE_STATE = {
  READY:      'ready',
  LISTENING:  'listening',
  PROCESSING: 'processing',
  RESPONSE:   'response',
}

const CAMERA_STATE = {
  INACTIVE:   'inactive',
  REQUESTING: 'requesting',
  ACTIVE:     'active',
  ERROR:      'error',
}

const SAMPLE_COMMANDS = [
  { id: 'see',      icon: 'visibility',   text: '"What do you see?"' },
  { id: 'front',    icon: 'near_me',      text: '"What is in front of me?"' },
  { id: 'scan',     icon: 'radar',        text: '"Scan my surroundings"' },
  { id: 'describe', icon: 'description',  text: '"Describe this scene"' },
  { id: 'read',     icon: 'menu_book',    text: '"Read this text"' },
  { id: 'repeat',   icon: 'replay',       text: '"Repeat that"' },
]

const QUICK_ACTIONS = [
  {
    id: 'scan',
    icon: 'radar',
    label: 'Scan Surroundings',
    desc: 'Analyse nearby environment',
    primary: true,
    // BACKEND REQUIRED: Connect "Scan Surroundings" to Vision Assist.
  },
  {
    id: 'read',
    icon: 'menu_book',
    label: 'Read Text',
    desc: 'Read visible text aloud',
    primary: false,
    // BACKEND REQUIRED: Connect "Read Text" to the appropriate vision/text processing service.
  },
  {
    id: 'repeat',
    icon: 'replay',
    label: 'Repeat',
    desc: 'Repeat the last response',
    primary: false,
    // BACKEND REQUIRED: Connect "Repeat" to the response history/service.
  },
  {
    id: 'help',
    icon: 'help_outline',
    label: 'Help',
    desc: 'Show what I can do',
    primary: false,
  },
]

/* ============================================================
   HOW IT WORKS — flow steps
   ============================================================ */
const FLOW_STEPS = [
  {
    id: 'voice',
    icon: 'mic',
    title: 'Voice Input',
    desc: 'You speak a natural command',
  },
  {
    id: 'understand',
    icon: 'psychology',
    title: 'Understand',
    desc: 'VisionX determines what help is needed',
  },
  {
    id: 'context',
    icon: 'videocam',
    title: 'Camera Context',
    desc: 'Visual info is gathered if required',
  },
  {
    id: 'respond',
    icon: 'spatial_audio_off',
    title: 'Response',
    desc: 'Accessible answer delivered to you',
  },
]

/* ============================================================
   Mic Orb Component
   ============================================================ */
function MicOrb({ voiceState, onPress }) {
  const isListening  = voiceState === VOICE_STATE.LISTENING
  const isProcessing = voiceState === VOICE_STATE.PROCESSING
  const isResponse   = voiceState === VOICE_STATE.RESPONSE

  const orbCls = [
    'hfa-orb',
    isListening  ? 'hfa-orb--listening'  : '',
    isProcessing ? 'hfa-orb--processing' : '',
    isResponse   ? 'hfa-orb--response'   : '',
    !isListening && !isProcessing && !isResponse ? 'hfa-orb--ready' : '',
  ].filter(Boolean).join(' ')

  const ringCls = [
    'hfa-orb-ring',
    isListening  ? 'hfa-orb-ring--listening'  : '',
    isProcessing ? 'hfa-orb-ring--processing' : '',
    (!isListening && !isProcessing) ? 'hfa-orb-ring--off' : '',
  ].filter(Boolean).join(' ')

  let icon = 'mic'
  if (isProcessing) icon = 'hourglass_top'
  if (isResponse)   icon = 'check_circle'

  const ariaLabel = isListening
    ? 'Stop listening'
    : isProcessing
    ? 'Processing your command, please wait'
    : isResponse
    ? 'Ask another question — press to speak again'
    : 'Tap to speak — start listening'

  return (
    <div className="hfa-orb-wrap">
      {(isListening || isProcessing) && (
        <>
          <div className={ringCls} aria-hidden="true" />
          <div className={ringCls} aria-hidden="true" />
          <div className={ringCls} aria-hidden="true" />
        </>
      )}
      <button
        type="button"
        className={orbCls}
        onClick={onPress}
        disabled={isProcessing}
        aria-label={ariaLabel}
        aria-pressed={isListening}
      >
        <span className="material-symbols-outlined hfa-orb__icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    </div>
  )
}

/* ============================================================
   State Label
   ============================================================ */
function StateLabel({ voiceState }) {
  const map = {
    [VOICE_STATE.READY]:      { text: 'Ready to listen',  cls: '' },
    [VOICE_STATE.LISTENING]:  { text: 'Listening…',       cls: 'hfa-state--listening' },
    [VOICE_STATE.PROCESSING]: { text: 'Understanding…',   cls: 'hfa-state--processing' },
    [VOICE_STATE.RESPONSE]:   { text: 'Response ready',   cls: 'hfa-state--response' },
  }
  const { text, cls } = map[voiceState]

  return (
    <div className={`hfa-state ${cls}`} aria-live="polite" aria-atomic="true">
      <span className="hfa-state__dot" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}

/* ============================================================
   Camera Context Panel
   ============================================================ */
function CameraPanel({ cameraState, videoRef, onEnable, onDisable, cameraError }) {
  const isInactive   = cameraState === CAMERA_STATE.INACTIVE
  const isRequesting = cameraState === CAMERA_STATE.REQUESTING
  const isActive     = cameraState === CAMERA_STATE.ACTIVE
  const isError      = cameraState === CAMERA_STATE.ERROR

  let statusDotCls = 'hfa-camera-status__dot'
  if (isActive)     statusDotCls += ' hfa-camera-status__dot--active'
  if (isError)      statusDotCls += ' hfa-camera-status__dot--error'
  if (isRequesting) statusDotCls += ' hfa-camera-status__dot--loading'

  const statusText = isActive
    ? 'Camera is active'
    : isRequesting
    ? 'Requesting camera…'
    : isError
    ? 'Camera unavailable'
    : 'Camera is not active'

  const cardCls = [
    'hfa-camera-card',
    isActive ? 'hfa-camera-card--active' : '',
    isError  ? 'hfa-camera-card--error'  : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardCls} aria-label="Camera context panel">
      <div className="hfa-camera-card__header">
        <span className="material-symbols-outlined" aria-hidden="true">videocam</span>
        Camera Context
      </div>

      {/* Status indicator */}
      <div className="hfa-camera-status" aria-live="polite">
        <span className={statusDotCls} aria-hidden="true" />
        <span>{statusText}</span>
      </div>

      {/* Live preview or placeholder */}
      {isActive ? (
        <video
          ref={videoRef}
          className="hfa-camera-preview"
          autoPlay
          playsInline
          muted
          aria-label="Live camera preview"
        />
      ) : (
        <div
          className="hfa-camera-placeholder"
          role="img"
          aria-label="Camera preview not available"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {isError ? 'videocam_off' : 'videocam'}
          </span>
          <span>
            {isError
              ? 'Camera access was not granted'
              : 'Camera preview will appear here'}
          </span>
        </div>
      )}

      {/* Camera error message */}
      {isError && cameraError && (
        <div className="hfa-camera-error" role="alert" aria-live="assertive">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          <span>{cameraError}</span>
        </div>
      )}

      {/* Action button */}
      {!isActive && (
        <button
          type="button"
          className={`hfa-btn-camera ${isRequesting ? 'hfa-btn-camera--loading' : 'hfa-btn-camera--enable'}`}
          onClick={onEnable}
          disabled={isRequesting}
          aria-label="Enable camera for visual context"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {isRequesting ? 'progress_activity' : 'videocam'}
          </span>
          {isRequesting ? 'Requesting…' : 'Enable Camera'}
        </button>
      )}
      {isActive && (
        <button
          type="button"
          className="hfa-btn-camera hfa-btn-camera--disable"
          onClick={onDisable}
          aria-label="Turn off camera"
        >
          <span className="material-symbols-outlined" aria-hidden="true">videocam_off</span>
          Turn Off Camera
        </button>
      )}

      <p className="hfa-camera-note">
        Camera permission is requested only after you press "Enable Camera".
        No video is sent anywhere.
        {/* BACKEND REQUIRED: Send captured camera frames/context to the Vision AI service when a voice command requires visual information. */}
      </p>
    </div>
  )
}

/* ============================================================
   Response Panel (STATE 4)
   ============================================================ */
function ResponsePanel({ cameraState }) {
  const cameraAvailable = cameraState === CAMERA_STATE.ACTIVE

  return (
    <div className="hfa-response" aria-label="Sample interaction response">
      <div className="hfa-response__header">
        <div className="hfa-response__label">
          <span className="material-symbols-outlined" aria-hidden="true">smart_toy</span>
          VisionX
        </div>
        {/* DEMO TAG — clearly marks this as not a real AI response */}
        <span className="hfa-response__demo-tag" aria-label="Sample demonstration only">
          Sample / Demo
        </span>
      </div>

      {/* "You said" */}
      <div className="hfa-response__you">
        <span className="hfa-response__you-label">You said</span>
        <p className="hfa-response__you-text">"What do you see?"</p>
      </div>

      <hr className="hfa-response__divider" aria-hidden="true" />

      {/* Camera context info */}
      <div className="hfa-response__ai-label">
        <span className="material-symbols-outlined" aria-hidden="true">videocam</span>
        Camera context: {cameraAvailable ? 'Available' : 'Not available'}
      </div>

      {/* AI response */}
      <div className="hfa-response__ai">
        <div className="hfa-response__ai-label">
          <span className="material-symbols-outlined" aria-hidden="true">smart_toy</span>
          VisionX (Sample Response)
        </div>
        <p className="hfa-response__ai-text">
          I can analyze your surroundings and provide accessible information about
          nearby objects and visible details. Connect a camera and enable AI processing
          to receive real descriptions.
        </p>
        {/* BACKEND REQUIRED: Receive recognized voice command and AI response from the backend. */}
        {/* BACKEND REQUIRED: Return accessible AI responses to the Hands-Free Assist frontend. */}
      </div>

      {/* Actions */}
      <div className="hfa-response__actions">
        <button
          type="button"
          className="hfa-btn-read-aloud"
          aria-label="Read response aloud (not yet connected)"
          onClick={() => {
            // BACKEND REQUIRED: Connect "Read Aloud" to a text-to-speech service.
          }}
        >
          <span className="material-symbols-outlined" aria-hidden="true">volume_up</span>
          Read response aloud
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Processing Skeleton (STATE 3)
   ============================================================ */
function ProcessingSkeleton({ cameraState }) {
  const cameraAvailable = cameraState === CAMERA_STATE.ACTIVE
  return (
    <div className="hfa-processing-skeleton" aria-label="Processing your request, please wait">
      <div
        className="hfa-processing-skeleton__line"
        role="status"
        aria-live="polite"
        aria-label="Understanding your command…"
        style={{ width: '100%' }}
      />
      <div className="hfa-processing-skeleton__line" />
      <div className="hfa-processing-skeleton__line" />
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.78rem',
        color: 'var(--on-surface-variant)',
        margin: '0.25rem 0 0',
      }}>
        Camera context: {cameraAvailable
          ? 'Available — visual information will be used'
          : 'Not active — enable camera for visual commands'
        }
        {/* BACKEND REQUIRED: Send recognized voice input to the AI/command processing service. */}
        {/* BACKEND REQUIRED: Connect recognized commands to VisionX assistance features. */}
      </p>
    </div>
  )
}

/* ============================================================
   Main Component
   ============================================================ */
export default function HandsFreeAssistPage({ onBack: _onBack }) {
  /* ── Voice state ─────────────────────────────────────── */
  const [voiceState, setVoiceState] = useState(VOICE_STATE.READY)
  const [micError,   setMicError]   = useState(null)

  /* ── Camera state ────────────────────────────────────── */
  const [cameraState, setCameraState] = useState(CAMERA_STATE.INACTIVE)
  const [cameraError, setCameraError] = useState(null)

  /* ── Refs ────────────────────────────────────────────── */
  const micStreamRef    = useRef(null)
  const audioCtxRef     = useRef(null)
  const analyserRef     = useRef(null)
  const sourceRef       = useRef(null)
  const rafRef          = useRef(null)
  const camStreamRef    = useRef(null)
  const videoRef        = useRef(null)
  const processingTimer = useRef(null)

  /* ── Cleanup helpers ─────────────────────────────────── */
  const cleanupMic = useCallback(() => {
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    try { sourceRef.current?.disconnect()  } catch { /* ignore */ }
    try { analyserRef.current?.disconnect() } catch { /* ignore */ }
    if (audioCtxRef.current?.state !== 'closed') {
      try { audioCtxRef.current?.close() } catch { /* ignore */ }
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    sourceRef.current    = null
    analyserRef.current  = null
    audioCtxRef.current  = null
    micStreamRef.current = null
  }, [])

  const cleanupCamera = useCallback(() => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop())
    camStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  /* ── Unmount cleanup ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      cleanupMic()
      cleanupCamera()
      if (processingTimer.current) clearTimeout(processingTimer.current)
    }
  }, [cleanupMic, cleanupCamera])

  /* ── Start microphone ────────────────────────────────── */
  const handleTapToSpeak = useCallback(async () => {
    setMicError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Microphone access is not supported by your browser.')
      return
    }

    try {
      // BACKEND REQUIRED: Connect microphone/voice input to the voice processing service.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()
      audioCtxRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      setVoiceState(VOICE_STATE.LISTENING)

      // Note: we read audio levels but display no level meter here (per spec: no fake activity)
    } catch (err) {
      cleanupMic()
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError(
          'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        )
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone was found. Please connect a microphone and try again.')
      } else {
        setMicError('Unable to access the microphone. Check your browser permissions.')
      }
    }
  }, [cleanupMic])

  /* ── Stop microphone → processing ───────────────────── */
  const handleStopListening = useCallback(() => {
    cleanupMic()
    setVoiceState(VOICE_STATE.PROCESSING)

    // BACKEND REQUIRED: Send recognized voice input to the AI/command processing service.
    // Simulate a processing delay, then show the sample response.
    processingTimer.current = setTimeout(() => {
      setVoiceState(VOICE_STATE.RESPONSE)
      // BACKEND REQUIRED: Receive structured voice command and response data.
    }, 2400)
  }, [cleanupMic])

  /* ── Orb press handler ───────────────────────────────── */
  const handleOrbPress = useCallback(() => {
    if (voiceState === VOICE_STATE.READY || voiceState === VOICE_STATE.RESPONSE) {
      handleTapToSpeak()
    } else if (voiceState === VOICE_STATE.LISTENING) {
      handleStopListening()
    }
    // PROCESSING: button disabled — no action
  }, [voiceState, handleTapToSpeak, handleStopListening])

  /* ── New question ────────────────────────────────────── */
  const handleNewQuestion = useCallback(() => {
    if (processingTimer.current) clearTimeout(processingTimer.current)
    setVoiceState(VOICE_STATE.READY)
    setMicError(null)
  }, [])

  /* ── Enable camera ───────────────────────────────────── */
  const handleEnableCamera = useCallback(async () => {
    setCameraError(null)
    setCameraState(CAMERA_STATE.REQUESTING)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.')
      setCameraState(CAMERA_STATE.ERROR)
      return
    }

    try {
      // BACKEND REQUIRED: Send captured camera frames/context to the Vision AI service
      // when a voice command requires visual information.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      camStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState(CAMERA_STATE.ACTIVE)
    } catch (err) {
      cleanupCamera()
      let msg = 'Unable to access the camera. Check your browser settings.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera access was denied. Please allow camera access in your browser settings and try again.'
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera was found on this device.'
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Unable to find a suitable camera. Please try with a different device.'
      }
      setCameraError(msg)
      setCameraState(CAMERA_STATE.ERROR)
    }
  }, [cleanupCamera])

  /* ── Disable camera ──────────────────────────────────── */
  const handleDisableCamera = useCallback(() => {
    cleanupCamera()
    setCameraState(CAMERA_STATE.INACTIVE)
    setCameraError(null)
  }, [cleanupCamera])

  /* ── Quick action handler ────────────────────────────── */
  const handleQuickAction = useCallback((id) => {
    // BACKEND REQUIRED: Connect recognized commands to VisionX assistance features.
    // For now, transition to LISTENING state so the user can give a voice command.
    if (id === 'scan' || id === 'read') {
      if (voiceState === VOICE_STATE.READY || voiceState === VOICE_STATE.RESPONSE) {
        handleTapToSpeak()
      }
    }
    // 'repeat' and 'help': no-op until backend is connected
  }, [voiceState, handleTapToSpeak])

  /* ── Sample command chip ─────────────────────────────── */
  const handleCommandChip = useCallback(() => {
    if (voiceState === VOICE_STATE.READY || voiceState === VOICE_STATE.RESPONSE) {
      handleTapToSpeak()
    }
  }, [voiceState, handleTapToSpeak])

  /* ── Derived strings ─────────────────────────────────── */
  const orbHint = {
    [VOICE_STATE.READY]:      'Tap the microphone to start speaking.',
    [VOICE_STATE.LISTENING]:  'Listening for your command — tap again when you\'re done.',
    [VOICE_STATE.PROCESSING]: 'Understanding your request…',
    [VOICE_STATE.RESPONSE]:   'Tap the microphone to ask another question.',
  }[voiceState]

  const voiceCardCls = [
    'hfa-voice-card',
    voiceState === VOICE_STATE.LISTENING  ? 'hfa-voice-card--listening'  : '',
    voiceState === VOICE_STATE.PROCESSING ? 'hfa-voice-card--processing' : '',
    voiceState === VOICE_STATE.RESPONSE   ? 'hfa-voice-card--response'   : '',
  ].filter(Boolean).join(' ')

  const isListening  = voiceState === VOICE_STATE.LISTENING
  const isProcessing = voiceState === VOICE_STATE.PROCESSING
  const isResponse   = voiceState === VOICE_STATE.RESPONSE
  const isReady      = voiceState === VOICE_STATE.READY

  return (
    <main className="hfa-page" id="main-content" aria-label="Hands-Free Assist">
      <div className="hfa-page__ambient" aria-hidden="true" />

      <div className="container hfa-page__body">

        {/* ── Hero ─────────────────────────────────────── */}
        <header className="hfa-hero">
          <div className="hfa-hero__badge" role="status">
            <span className="hfa-hero__badge-dot" aria-hidden="true" />
            Voice-First Interaction
          </div>
          <h1 className="hfa-hero__title">How can I help?</h1>
          <p className="hfa-hero__sub">
            Use your voice to interact with VisionX.
          </p>
        </header>

        {/* ── Primary Interaction Layout ────────────────── */}
        <div className="hfa-interaction">

          {/* ── Voice Control Card ──────────────────────── */}
          <section
            className={voiceCardCls}
            aria-label="Voice interaction control"
          >
            {/* State label */}
            <StateLabel voiceState={voiceState} />

            {/* Mic orb */}
            <MicOrb voiceState={voiceState} onPress={handleOrbPress} />

            {/* Hint text */}
            <p className="hfa-orb-hint" aria-live="polite">{orbHint}</p>

            {/* Error */}
            {micError && (
              <div className="hfa-mic-error" role="alert" aria-live="assertive">
                <span className="material-symbols-outlined hfa-mic-error__icon" aria-hidden="true">
                  error
                </span>
                <span>{micError}</span>
              </div>
            )}

            {/* State-specific content */}
            {isReady && (
              <button
                type="button"
                className="hfa-btn-speak"
                onClick={handleTapToSpeak}
                aria-label="Tap to speak — start voice interaction"
              >
                <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                Tap to Speak
              </button>
            )}

            {isListening && (
              <button
                type="button"
                className="hfa-btn-stop"
                onClick={handleStopListening}
                aria-label="Stop listening"
              >
                <span className="material-symbols-outlined" aria-hidden="true">stop_circle</span>
                Stop Listening
              </button>
            )}

            {isProcessing && <ProcessingSkeleton cameraState={cameraState} />}

            {isResponse && (
              <>
                <ResponsePanel cameraState={cameraState} />
                <button
                  type="button"
                  className="hfa-btn-new"
                  onClick={handleNewQuestion}
                  aria-label="Start a new voice interaction"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
                  Ask another question
                </button>
              </>
            )}
          </section>

          {/* ── Camera Context Panel ─────────────────────── */}
          <aside aria-label="Camera context for voice commands">
            <CameraPanel
              cameraState={cameraState}
              videoRef={videoRef}
              onEnable={handleEnableCamera}
              onDisable={handleDisableCamera}
              cameraError={cameraError}
            />
          </aside>
        </div>

        {/* ── Quick Actions ─────────────────────────────── */}
        <section className="hfa-quick-actions" aria-labelledby="quick-actions-label">
          <div className="hfa-section-label" id="quick-actions-label">
            <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
            Quick actions
          </div>
          <div className="hfa-quick-actions__grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`hfa-action-btn${action.primary ? ' hfa-action-btn--primary' : ''}`}
                onClick={() => handleQuickAction(action.id)}
                aria-label={`${action.label}: ${action.desc}`}
              >
                <span className="material-symbols-outlined hfa-action-btn__icon" aria-hidden="true">
                  {action.icon}
                </span>
                <span className="hfa-action-btn__label">{action.label}</span>
                <span className="hfa-action-btn__desc">{action.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Try Saying ───────────────────────────────── */}
        <section className="hfa-try-saying" aria-labelledby="try-saying-label">
          <div className="hfa-section-label" id="try-saying-label">
            <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
            Try saying — example commands
          </div>
          <div className="hfa-commands-grid">
            {SAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                className="hfa-command-chip"
                onClick={handleCommandChip}
                aria-label={`Example command: ${cmd.text} — tap to try`}
              >
                <span className="material-symbols-outlined hfa-command-chip__icon" aria-hidden="true">
                  {cmd.icon}
                </span>
                <span className="hfa-command-chip__text">{cmd.text}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── How Hands-Free Assist Will Work ──────────── */}
        <section className="hfa-how-it-works" aria-labelledby="how-it-works-label">
          <div className="hfa-section-label" id="how-it-works-label">
            <span className="material-symbols-outlined" aria-hidden="true">schema</span>
            How Hands-Free Assist will work
          </div>
          <div className="hfa-flow" role="list">
            {FLOW_STEPS.map((step, i) => (
              <>
                <div key={step.id} className="hfa-flow-step" role="listitem">
                  <div className="hfa-flow-step__icon" aria-hidden="true">
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                  <span className="hfa-flow-step__title">{step.title}</span>
                  <span className="hfa-flow-step__desc">{step.desc}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div key={`arrow-${step.id}`} className="hfa-flow-arrow" aria-hidden="true">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                )}
              </>
            ))}
          </div>
          <div className="hfa-how-future-note" role="note">
            <span className="material-symbols-outlined" aria-hidden="true">info</span>
            This shows the future interaction flow. AI and backend services are not yet connected.
            {/* BACKEND REQUIRED: Connect recognized commands to VisionX assistance features. */}
          </div>
        </section>

        {/* ── Sample Recent Interaction ─────────────────── */}
        <section className="hfa-recent" aria-labelledby="recent-label">
          <div className="hfa-section-label" id="recent-label">
            <span className="material-symbols-outlined" aria-hidden="true">forum</span>
            Sample interaction
          </div>

          <div
            className="hfa-interaction-card"
            aria-label="Sample interaction demonstration — not a real AI response"
          >
            {/* Demo banner */}
            <div className="hfa-interaction-card__demo-banner" role="note">
              <span className="material-symbols-outlined" aria-hidden="true">info</span>
              Sample Interaction — Not a real AI response
            </div>

            {/* User message */}
            <div className="hfa-chat-row hfa-chat-row--user">
              <div className="hfa-chat-bubble hfa-chat-bubble--user">
                "What do you see?"
              </div>
              <div className="hfa-chat-avatar hfa-chat-avatar--user" aria-hidden="true">
                <span className="material-symbols-outlined">person</span>
              </div>
            </div>

            {/* AI message */}
            <div className="hfa-chat-row hfa-chat-row--ai">
              <div className="hfa-chat-avatar hfa-chat-avatar--ai" aria-hidden="true">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="hfa-chat-bubble hfa-chat-bubble--ai">
                I can see a chair and a laptop on a desk. There appears to be good lighting and no immediate obstacles nearby.
              </div>
            </div>

            {/* Footer */}
            <div className="hfa-interaction-card__footer">
              <span className="hfa-interaction-card__note">
                This is a sample demonstration only. No AI model is running.
              </span>
              <button
                type="button"
                className="hfa-btn-read-aloud"
                aria-label="Read response aloud — not yet connected to text-to-speech"
                onClick={() => {
                  // BACKEND REQUIRED: Connect "Read Aloud" to a text-to-speech service.
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">volume_up</span>
                Read aloud
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
