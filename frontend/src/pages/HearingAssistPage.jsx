/**
 * VisionX — Hearing Assist Page
 * Interface for AI-powered environmental sound recognition and visual alerts
 */

import { useState, useRef, useEffect } from 'react'
import './HearingAssistPage.css'

export default function HearingAssistPage({ onBack }) {
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const rafIdRef = useRef(null)

  const [isListening, setIsListening] = useState(false)
  const [micLoading, setMicLoading] = useState(false)
  const [micError, setMicError] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Clean up all audio nodes, streams, and animation frames safely
  const cleanupAudio = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch {
        // ignore disconnection errors
      }
      sourceRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        // ignore disconnection errors
      }
      analyserRef.current = null
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
        }
      } catch {
        // ignore context close errors
      }
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setAudioLevel(0)
  }

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [])

  // Start real microphone capture and real-time level analyzer
  const handleStartListening = async () => {
    setMicError(null)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone access is not supported by your browser or environment.')
      return
    }

    try {
      setMicLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Initialize Web Audio API Analyser
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      // Resume if browser suspended AudioContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      setIsListening(true)
      setMicLoading(false)

      // BACKEND REQUIRED: Send captured microphone audio to the AI sound classification service.

      // Continuously read normalized volume levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateActivity = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length
        // Normalize 0-100 scale based on audio volume
        const normalized = Math.min(100, Math.round((average / 110) * 100))
        setAudioLevel(normalized)

        rafIdRef.current = requestAnimationFrame(updateActivity)
      }

      rafIdRef.current = requestAnimationFrame(updateActivity)
    } catch (err) {
      cleanupAudio()
      setMicLoading(false)
      setIsListening(false)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError(
          'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        )
      } else {
        setMicError(
          'Unable to access the microphone. Please check your microphone and browser permissions.'
        )
      }
    }
  }

  // Stop microphone capture and reset activity analyzer
  const handleStopListening = () => {
    cleanupAudio()
    setIsListening(false)
    setMicLoading(false)
  }

  // Determine qualitative audio activity level
  const getActivityStatus = (level) => {
    if (level < 10) return { label: 'Low / Quiet', text: 'Ambient background level' }
    if (level < 45) return { label: 'Moderate', text: 'Sound detected nearby' }
    return { label: 'Active', text: 'Prominent acoustic activity' }
  }

  const activityStatus = getActivityStatus(audioLevel)

  // Sample recent detected sounds (demo data)
  const sampleRecentSounds = [
    {
      id: 'sound-1',
      title: 'Doorbell detected',
      category: 'Household Alert',
      icon: 'notifications_active',
      urgency: 'high',
      timestamp: '2 mins ago',
      confidence: 'Sample 98%',
      description: 'Chime pattern recognized at front door area.',
    },
    {
      id: 'sound-2',
      title: 'Vehicle approaching',
      category: 'Safety Alert',
      icon: 'directions_car',
      urgency: 'warning',
      timestamp: '5 mins ago',
      confidence: 'Sample 94%',
      description: 'Engine sound approaching from left side.',
    },
    {
      id: 'sound-3',
      title: 'Someone speaking',
      category: 'Voice Activity',
      icon: 'record_voice_over',
      urgency: 'normal',
      timestamp: '12 mins ago',
      confidence: 'Sample 91%',
      description: 'Human voice detected in close proximity.',
    },
  ]

  // Accessibility principles list
  const accessibilityPrinciples = [
    {
      icon: 'visibility',
      title: 'Clear Visual Alerts',
      desc: 'Important acoustic events are rendered as prominent, high-contrast visual cues.',
    },
    {
      icon: 'menu_book',
      title: 'High Readability',
      desc: 'Large typefaces and clear icons ensure immediate comprehension at a glance.',
    },
    {
      icon: 'touch_app',
      title: 'Simple Controls',
      desc: 'One-touch toggles with large accessible touch targets and plain language.',
    },
    {
      icon: 'volume_off',
      title: 'No Sound-Only Feedback',
      desc: 'Every system state and detection is fully perceptible through visual interfaces.',
    },
    {
      icon: 'keyboard',
      title: 'Keyboard Accessible',
      desc: 'Full navigation support using standard keyboard controls and focus rings.',
    },
  ]

  return (
    <main className="main hearing-assist-page" id="main-content">
      <div className="hearing-assist__ambient" aria-hidden="true" />
      <div className="container hearing-assist__inner">
        {/* Page Header */}
        <header className="hearing-assist__header">
          <div className="hearing-assist__badge" role="status">
            <span className="hearing-assist__badge-dot" aria-hidden="true" />
            <span>Hearing Assist Modality</span>
          </div>
          <h1 className="hearing-assist__title">
            Understand important sounds around you
          </h1>
          <p className="hearing-assist__subtitle">
            VisionX can turn important environmental sounds into clear visual alerts.
          </p>
        </header>

        {/* Central Listening Control Card */}
        <section
          className={`hearing-control ${isListening ? 'hearing-control--listening' : ''}`}
          aria-labelledby="hearing-control-title"
        >
          <div className="hearing-control__card">
            {/* Error Banner if mic access fails */}
            {micError && (
              <div className="hearing-control__error-banner" role="alert">
                <span className="material-symbols-outlined hearing-control__error-icon" aria-hidden="true">
                  mic_off
                </span>
                <div className="hearing-control__error-body">
                  <strong className="hearing-control__error-title">Microphone Notice</strong>
                  <p className="hearing-control__error-desc">{micError}</p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm hearing-control__error-dismiss"
                  onClick={() => setMicError(null)}
                  aria-label="Dismiss microphone notice"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Listening Indicator / Icon */}
            <div
              className={`hearing-control__icon-wrap ${
                isListening ? 'hearing-control__icon-wrap--active' : ''
              }`}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined hearing-control__icon">
                {micLoading ? 'hourglass_top' : isListening ? 'hearing' : 'mic'}
              </span>
              {isListening && (
                <div className="hearing-control__wave-bars" aria-hidden="true">
                  <span
                    className="wave-bar"
                    style={{ height: `${Math.max(4, Math.min(22, (audioLevel * 0.4) + 4))}px` }}
                  />
                  <span
                    className="wave-bar"
                    style={{ height: `${Math.max(6, Math.min(28, (audioLevel * 0.8) + 6))}px` }}
                  />
                  <span
                    className="wave-bar"
                    style={{ height: `${Math.max(5, Math.min(25, (audioLevel * 0.6) + 5))}px` }}
                  />
                  <span
                    className="wave-bar"
                    style={{ height: `${Math.max(4, Math.min(20, (audioLevel * 0.45) + 4))}px` }}
                  />
                </div>
              )}
            </div>

            <div className="hearing-control__info">
              <div className="hearing-control__status-tag" role="status" aria-live="polite">
                <span
                  className={`hearing-control__status-dot ${
                    isListening ? 'hearing-control__status-dot--active' : ''
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {micLoading
                    ? 'Connecting...'
                    : isListening
                    ? 'Listening Active'
                    : micError
                    ? 'Microphone Blocked'
                    : 'Sensor Ready'}
                </span>
              </div>

              <h2 className="hearing-control__heading" id="hearing-control-title">
                {micLoading
                  ? 'Requesting microphone access...'
                  : isListening
                  ? 'Listening for environmental sounds'
                  : 'Hearing Assist is ready'}
              </h2>

              <p className="hearing-control__desc">
                {micLoading
                  ? 'Please accept the browser prompt to allow microphone access.'
                  : isListening
                  ? 'Monitoring for sirens, doorbells, alarms, speech, and safety cues in real-time.'
                  : 'Start listening to detect important environmental sounds.'}
              </p>

              {/* Real-time Microphone Activity Indicator */}
              {isListening && (
                <div
                  className="hearing-control__activity"
                  role="region"
                  aria-label="Real-time microphone activity monitor"
                >
                  <div className="hearing-control__activity-header">
                    <div className="hearing-control__activity-title-wrap">
                      <span className="material-symbols-outlined hearing-control__activity-icon" aria-hidden="true">
                        graphic_eq
                      </span>
                      <span className="hearing-control__activity-label">Microphone Activity</span>
                    </div>
                    <div className="hearing-control__activity-badge" role="status" aria-live="polite">
                      <span className="hearing-control__activity-val">{activityStatus.label}</span>
                      <span className="hearing-control__activity-pct" aria-hidden="true">
                        ({audioLevel}%)
                      </span>
                    </div>
                  </div>

                  {/* Accessible Activity Meter Bar */}
                  <div
                    className="hearing-control__meter"
                    role="progressbar"
                    aria-valuenow={audioLevel}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Microphone activity level: ${activityStatus.label} (${audioLevel} percent)`}
                  >
                    <div
                      className="hearing-control__meter-fill"
                      style={{ width: `${Math.max(3, audioLevel)}%` }}
                    />
                  </div>

                  <span className="hearing-control__activity-hint">
                    <span className="sr-only">Input description: </span>
                    {activityStatus.text}
                  </span>
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <div className="hearing-control__actions">
              {isListening ? (
                <button
                  type="button"
                  className="btn btn--secondary hearing-control__btn--stop"
                  onClick={handleStopListening}
                  aria-label="Stop sound detection"
                  aria-pressed="true"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    stop_circle
                  </span>
                  <span>Stop Listening</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary hearing-control__btn--start"
                  onClick={handleStartListening}
                  disabled={micLoading}
                  aria-label={micLoading ? 'Connecting to microphone...' : 'Start sound detection'}
                  aria-pressed="false"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {micLoading ? 'hourglass_top' : 'hearing'}
                  </span>
                  <span>{micLoading ? 'Connecting...' : 'Start Listening'}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Live Sound Alert & Sample Result Grid */}
        <div className="hearing-assist__grid">
          {/* Live Alert Section (Awaiting Real Backend Stream) */}
          <section className="hearing-alert-box" aria-labelledby="live-alert-heading">
            <div className="hearing-card hearing-card--live">
              <div className="hearing-card__header">
                <div className="hearing-card__title-wrap">
                  <span className="material-symbols-outlined hearing-card__icon" aria-hidden="true">
                    sensors
                  </span>
                  <h2 className="hearing-card__title" id="live-alert-heading">
                    Live Sound Alert
                  </h2>
                </div>
                <div className="hearing-card__badge" role="status">
                  <span className="hearing-card__badge-dot" aria-hidden="true" />
                  <span>{isListening ? 'Monitoring...' : 'Standby'}</span>
                </div>
              </div>

              {/* BACKEND REQUIRED: Receive structured sound detection results. */}
              {/* BACKEND REQUIRED: Display real-time accessibility alerts from backend results. */}
              <div className="hearing-alert-box__body" role="region" aria-live="polite">
                <div className="hearing-alert-box__empty">
                  <div className="hearing-alert-box__empty-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      {isListening ? 'spatial_tracking' : 'notifications_paused'}
                    </span>
                  </div>
                  <strong className="hearing-alert-box__empty-title">
                    {isListening ? 'Listening in progress' : 'No important sounds detected yet.'}
                  </strong>
                  <p className="hearing-alert-box__empty-desc">
                    {isListening
                      ? 'VisionX is analyzing incoming audio streams. Alerts will appear here instantly.'
                      : 'Detected sounds will appear here as clear visual alerts.'}
                  </p>
                </div>
              </div>

              <div className="hearing-card__footer">
                <span className="hearing-card__hint">
                  <span className="material-symbols-outlined" aria-hidden="true">info</span>
                  Live alerts prioritize critical acoustic signals such as alarms, doorbells, and approaching hazards.
                </span>
              </div>
            </div>
          </section>

          {/* Sample Result Preview Section */}
          <section className="hearing-sample-box" aria-labelledby="sample-result-heading">
            <div className="hearing-card hearing-card--sample">
              <div className="hearing-card__header">
                <div className="hearing-card__title-wrap">
                  <span className="material-symbols-outlined hearing-card__icon" aria-hidden="true">
                    preview
                  </span>
                  <h2 className="hearing-card__title" id="sample-result-heading">
                    Alert Format Preview
                  </h2>
                </div>
                <span className="sample-pill" aria-label="Sample demonstration preview">
                  <span className="sample-pill__dot" aria-hidden="true" />
                  SAMPLE RESULT
                </span>
              </div>

              <div className="hearing-sample-box__body">
                {/* Simulated Alert Notification */}
                <div
                  className="sample-alert-banner sample-alert-banner--doorbell"
                  role="region"
                  aria-label="Sample Alert Example"
                >
                  <div className="sample-alert-banner__icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div className="sample-alert-banner__content">
                    <div className="sample-alert-banner__top">
                      <span className="sample-alert-banner__tag">Household Sound</span>
                      <span className="sample-alert-banner__confidence">Confidence: Sample</span>
                    </div>
                    <strong className="sample-alert-banner__headline">
                      Doorbell detected
                    </strong>
                    <p className="sample-alert-banner__desc">
                      Important environmental sound • High priority visual alert
                    </p>
                  </div>
                </div>

                <div className="sample-alert-disclaimer" role="note">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    info
                  </span>
                  <span>
                    This is a simulated UI preview demonstrating how visual alerts will render once connected to the AI sound recognition model.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Recent Sounds Section */}
        <section className="hearing-recent" aria-labelledby="recent-sounds-heading">
          <div className="hearing-recent__header">
            <div className="hearing-recent__title-wrap">
              <span className="material-symbols-outlined hearing-recent__icon" aria-hidden="true">
                history
              </span>
              <h2 className="hearing-recent__title" id="recent-sounds-heading">
                Recent Sounds
              </h2>
            </div>
            <span className="sample-pill sample-pill--subtle" aria-label="Recent sounds demo data">
              Sample Data
            </span>
          </div>

          <div className="hearing-recent__grid" role="region" aria-label="Recent sounds list">
            {sampleRecentSounds.map((sound) => (
              <div key={sound.id} className="recent-card">
                <div className="recent-card__top">
                  <div
                    className={`recent-card__icon-wrap recent-card__icon-wrap--${sound.urgency}`}
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined">{sound.icon}</span>
                  </div>
                  <div className="recent-card__meta">
                    <span className="recent-card__category">{sound.category}</span>
                    <span className="recent-card__time">{sound.timestamp}</span>
                  </div>
                </div>
                <div className="recent-card__body">
                  <strong className="recent-card__title">{sound.title}</strong>
                  <p className="recent-card__desc">{sound.description}</p>
                </div>
                <div className="recent-card__footer">
                  <span className="recent-card__confidence-tag">{sound.confidence}</span>
                  <span className="recent-card__sample-label">Sample</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility Principles Section */}
        <section className="hearing-principles" aria-labelledby="principles-heading">
          <div className="hearing-principles__header">
            <h2 className="hearing-principles__title" id="principles-heading">
              Accessibility Principles
            </h2>
            <p className="hearing-principles__subtitle">
              Designed specifically for deaf and hard-of-hearing individuals with WCAG 2.1 AA contrast and clarity.
            </p>
          </div>

          <div className="hearing-principles__grid">
            {accessibilityPrinciples.map((item, idx) => (
              <div key={idx} className="principle-card">
                <div className="principle-card__icon-wrap" aria-hidden="true">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <strong className="principle-card__title">{item.title}</strong>
                <p className="principle-card__desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
