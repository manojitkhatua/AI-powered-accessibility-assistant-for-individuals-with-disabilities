/**
 * VisionX — Hands-Free Assist Page
 * Voice-first accessibility interface
 *
 * Real flow:
 * Microphone → FastAPI → Gemini STT
 * Camera frame → FastAPI → YOLO + Depth Anything V2
 * Structured context → Gemini → answer
 * Answer → UI + backend TTS audio
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Fragment,
} from 'react'

import './HandsFreeAssistPage.css'

/* ============================================================
   Constants
   ============================================================ */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

const VOICE_STATE = {
  READY: 'ready',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESPONSE: 'response',
}

const CAMERA_STATE = {
  INACTIVE: 'inactive',
  REQUESTING: 'requesting',
  ACTIVE: 'active',
  ERROR: 'error',
}

const SAMPLE_COMMANDS = [
  {
    id: 'see',
    icon: 'visibility',
    text: '"What do you see?"',
  },
  {
    id: 'front',
    icon: 'near_me',
    text: '"What is in front of me?"',
  },
  {
    id: 'scan',
    icon: 'radar',
    text: '"Scan my surroundings"',
  },
  {
    id: 'describe',
    icon: 'description',
    text: '"Describe this scene"',
  },
  {
    id: 'read',
    icon: 'menu_book',
    text: '"Read this text"',
  },
  {
    id: 'repeat',
    icon: 'replay',
    text: '"Repeat that"',
  },
]

const QUICK_ACTIONS = [
  {
    id: 'scan',
    icon: 'radar',
    label: 'Scan Surroundings',
    desc: 'Analyse nearby environment',
    primary: true,
  },
  {
    id: 'read',
    icon: 'menu_book',
    label: 'Read Text',
    desc: 'Read visible text aloud',
    primary: false,
  },
  {
    id: 'repeat',
    icon: 'replay',
    label: 'Repeat',
    desc: 'Repeat the last response',
    primary: false,
  },
  {
    id: 'help',
    icon: 'help_outline',
    label: 'Help',
    desc: 'Show what I can do',
    primary: false,
  },
]

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
    desc: 'Visual information is gathered if required',
  },
  {
    id: 'respond',
    icon: 'spatial_audio_off',
    title: 'Response',
    desc: 'Accessible answer delivered to you',
  },
]

/* ============================================================
   Mic Orb
   ============================================================ */

function MicOrb({ voiceState, onPress }) {
  const isListening =
    voiceState === VOICE_STATE.LISTENING

  const isProcessing =
    voiceState === VOICE_STATE.PROCESSING

  const isResponse =
    voiceState === VOICE_STATE.RESPONSE

  const orbCls = [
    'hfa-orb',
    isListening ? 'hfa-orb--listening' : '',
    isProcessing ? 'hfa-orb--processing' : '',
    isResponse ? 'hfa-orb--response' : '',
    !isListening &&
    !isProcessing &&
    !isResponse
      ? 'hfa-orb--ready'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const ringCls = [
    'hfa-orb-ring',
    isListening
      ? 'hfa-orb-ring--listening'
      : '',
    isProcessing
      ? 'hfa-orb-ring--processing'
      : '',
    !isListening && !isProcessing
      ? 'hfa-orb-ring--off'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  let icon = 'mic'

  if (isProcessing) {
    icon = 'hourglass_top'
  }

  if (isResponse) {
    icon = 'check_circle'
  }

  const ariaLabel = isListening
    ? 'Stop listening'
    : isProcessing
    ? 'Processing your command, please wait'
    : isResponse
    ? 'Ask another question'
    : 'Tap to speak'

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
        <span
          className="material-symbols-outlined hfa-orb__icon"
          aria-hidden="true"
        >
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
    [VOICE_STATE.READY]: {
      text: 'Ready to listen',
      cls: '',
    },

    [VOICE_STATE.LISTENING]: {
      text: 'Listening…',
      cls: 'hfa-state--listening',
    },

    [VOICE_STATE.PROCESSING]: {
      text: 'Understanding…',
      cls: 'hfa-state--processing',
    },

    [VOICE_STATE.RESPONSE]: {
      text: 'Response ready',
      cls: 'hfa-state--response',
    },
  }

  const current = map[voiceState]

  return (
    <div
      className={`hfa-state ${current.cls}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="hfa-state__dot"
        aria-hidden="true"
      />

      <span>{current.text}</span>
    </div>
  )
}

/* ============================================================
   Camera Panel
   ============================================================ */

function CameraPanel({
  cameraState,
  videoRef,
  onEnable,
  onDisable,
  cameraError,
}) {
  const isRequesting =
    cameraState === CAMERA_STATE.REQUESTING

  const isActive =
    cameraState === CAMERA_STATE.ACTIVE

  const isError =
    cameraState === CAMERA_STATE.ERROR

  let statusDotCls =
    'hfa-camera-status__dot'

  if (isActive) {
    statusDotCls +=
      ' hfa-camera-status__dot--active'
  }

  if (isError) {
    statusDotCls +=
      ' hfa-camera-status__dot--error'
  }

  if (isRequesting) {
    statusDotCls +=
      ' hfa-camera-status__dot--loading'
  }

  const statusText = isActive
    ? 'Camera is active'
    : isRequesting
    ? 'Requesting camera…'
    : isError
    ? 'Camera unavailable'
    : 'Camera is not active'

  const cardCls = [
    'hfa-camera-card',
    isActive
      ? 'hfa-camera-card--active'
      : '',
    isError
      ? 'hfa-camera-card--error'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardCls}
      aria-label="Camera context panel"
    >
      <div className="hfa-camera-card__header">
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
        >
          videocam
        </span>

        Camera Context
      </div>

      <div
        className="hfa-camera-status"
        aria-live="polite"
      >
        <span
          className={statusDotCls}
          aria-hidden="true"
        />

        <span>{statusText}</span>
      </div>

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
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            {isError
              ? 'videocam_off'
              : 'videocam'}
          </span>

          <span>
            {isError
              ? 'Camera access was not granted'
              : 'Camera preview will appear here'}
          </span>
        </div>
      )}

      {isError && cameraError && (
        <div
          className="hfa-camera-error"
          role="alert"
          aria-live="assertive"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            error
          </span>

          <span>{cameraError}</span>
        </div>
      )}

      {!isActive && (
        <button
          type="button"
          className={`hfa-btn-camera ${
            isRequesting
              ? 'hfa-btn-camera--loading'
              : 'hfa-btn-camera--enable'
          }`}
          onClick={onEnable}
          disabled={isRequesting}
          aria-label="Enable camera for visual context"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            {isRequesting
              ? 'progress_activity'
              : 'videocam'}
          </span>

          {isRequesting
            ? 'Requesting…'
            : 'Enable Camera'}
        </button>
      )}

      {isActive && (
        <button
          type="button"
          className="hfa-btn-camera hfa-btn-camera--disable"
          onClick={onDisable}
          aria-label="Turn off camera"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            videocam_off
          </span>

          Turn Off Camera
        </button>
      )}

      <p className="hfa-camera-note">
        Camera permission is requested only after
        you press "Enable Camera". A camera frame is
        captured only when visual assistance is requested.
      </p>
    </div>
  )
}

/* ============================================================
   Response Panel
   ============================================================ */

function ResponsePanel({
  response,
  cameraState,
  onReadAloud,
}) {
  const cameraAvailable =
    cameraState === CAMERA_STATE.ACTIVE

  return (
    <div
      className="hfa-response"
      aria-label="VisionX response"
    >
      <div className="hfa-response__header">
        <div className="hfa-response__label">
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            smart_toy
          </span>

          VisionX
        </div>

        <span
          className="hfa-response__demo-tag"
          aria-label="Live AI response"
        >
          Live AI
        </span>
      </div>

      <div className="hfa-response__you">
        <span className="hfa-response__you-label">
          VisionX request
        </span>

        <p className="hfa-response__you-text">
          Voice command processed with current
          camera context.
        </p>
      </div>

      <hr
        className="hfa-response__divider"
        aria-hidden="true"
      />

      <div className="hfa-response__ai-label">
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
        >
          videocam
        </span>

        Camera context:{' '}
        {cameraAvailable
          ? 'Available'
          : 'Not available'}
      </div>

      <div className="hfa-response__ai">
        <div className="hfa-response__ai-label">
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            smart_toy
          </span>

          VisionX
        </div>

        <p className="hfa-response__ai-text">
          {response?.answer ||
            'VisionX did not return an answer.'}
        </p>
      </div>

      <div className="hfa-response__actions">
        <button
          type="button"
          className="hfa-btn-read-aloud"
          onClick={onReadAloud}
          disabled={!response?.answer}
          aria-label="Read VisionX response aloud"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            volume_up
          </span>

          Read response aloud
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Processing Skeleton
   ============================================================ */

function ProcessingSkeleton({
  cameraState,
}) {
  const cameraAvailable =
    cameraState === CAMERA_STATE.ACTIVE

  return (
    <div
      className="hfa-processing-skeleton"
      aria-label="Processing your request"
    >
      <div
        className="hfa-processing-skeleton__line"
        role="status"
        aria-live="polite"
        aria-label="Understanding your command"
        style={{ width: '100%' }}
      />

      <div className="hfa-processing-skeleton__line" />

      <div className="hfa-processing-skeleton__line" />

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.78rem',
          color: 'var(--on-surface-variant)',
          margin: '0.25rem 0 0',
        }}
      >
        Camera context:{' '}
        {cameraAvailable
          ? 'Available — current frame will be analysed'
          : 'Not active — enable camera for visual questions'}
      </p>
    </div>
  )
}

/* ============================================================
   Main Component
   ============================================================ */

export default function HandsFreeAssistPage() {
  /* ── Voice ───────────────────────────────────────────── */

  const [voiceState, setVoiceState] =
    useState(VOICE_STATE.READY)

  const [micError, setMicError] =
    useState(null)

  const [assistantResponse, setAssistantResponse] =
    useState(null)

  const [quickActionLoading, setQuickActionLoading] =
    useState(null)

  const [quickActionMessage, setQuickActionMessage] =
    useState(null)

  /* ── Camera ──────────────────────────────────────────── */

  const [cameraState, setCameraState] =
    useState(CAMERA_STATE.INACTIVE)

  const [cameraError, setCameraError] =
    useState(null)

  /* ── Refs ────────────────────────────────────────────── */

  const micStreamRef = useRef(null)

  const audioCtxRef = useRef(null)

  const analyserRef = useRef(null)

  const sourceRef = useRef(null)

  const rafRef = useRef(null)

  const camStreamRef = useRef(null)

  const videoRef = useRef(null)

  const recorderRef = useRef(null)

  const audioChunksRef = useRef([])

  /* ============================================================
     Microphone cleanup
     ============================================================ */

  const cleanupMic = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(
        rafRef.current,
      )

      rafRef.current = null
    }

    try {
      sourceRef.current?.disconnect()
    } catch {
      // Ignore cleanup errors.
    }

    try {
      analyserRef.current?.disconnect()
    } catch {
      // Ignore cleanup errors.
    }

    if (
      audioCtxRef.current &&
      audioCtxRef.current.state !== 'closed'
    ) {
      try {
        audioCtxRef.current.close()
      } catch {
        // Ignore cleanup errors.
      }
    }

    micStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop())

    sourceRef.current = null
    analyserRef.current = null
    audioCtxRef.current = null
    micStreamRef.current = null
  }, [])

  /* ============================================================
     Camera cleanup
     ============================================================ */

  const cleanupCamera = useCallback(() => {
    camStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop())

    camStreamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  /* ============================================================
     Attach camera after React renders video element
     ============================================================ */

  useEffect(() => {
    if (
      cameraState === CAMERA_STATE.ACTIVE &&
      videoRef.current &&
      camStreamRef.current
    ) {
      videoRef.current.srcObject =
        camStreamRef.current

      videoRef.current
        .play()
        .catch(() => {
          // Browser may delay playback.
        })
    }
  }, [cameraState])

  /* ============================================================
     Unmount cleanup
     ============================================================ */

  useEffect(() => {
    return () => {
      cleanupMic()
      cleanupCamera()

      if (
        recorderRef.current &&
        recorderRef.current.state ===
          'recording'
      ) {
        recorderRef.current.stop()
      }

      recorderRef.current = null
      audioChunksRef.current = []
    }
  }, [cleanupMic, cleanupCamera])

  /* ============================================================
     Capture current camera frame
     ============================================================ */

  const captureCameraFrame =
    useCallback(async () => {
      const video = videoRef.current

      if (!video) {
        throw new Error(
          'Camera preview is not available.'
        )
      }

      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        throw new Error(
          'Camera is still starting. Please wait a moment and try again.'
        )
      }

      const canvas =
        document.createElement('canvas')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context =
        canvas.getContext('2d')

      if (!context) {
        throw new Error(
          'Unable to capture the camera frame.'
        )
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      return new Promise(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(
                  new Error(
                    'Unable to capture camera frame.'
                  ),
                )
              }
            },
            'image/jpeg',
            0.85,
          )
        },
      )
    }, [])

  /* ============================================================
     Start microphone recording
     ============================================================ */

  const handleTapToSpeak =
    useCallback(async () => {
      setMicError(null)
      setAssistantResponse(null)

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        setMicError(
          'Microphone access is not supported by your browser.',
        )

        return
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            },
          )

        micStreamRef.current = stream

        const AudioCtx =
          window.AudioContext ||
          window.webkitAudioContext

        if (!AudioCtx) {
          throw new Error(
            'Audio processing is not supported by this browser.',
          )
        }

        const ctx = new AudioCtx()

        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        audioCtxRef.current = ctx

        const analyser =
          ctx.createAnalyser()

        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.75

        analyserRef.current = analyser

        const source =
          ctx.createMediaStreamSource(
            stream,
          )

        source.connect(analyser)

        sourceRef.current = source

        let recorder

        try {
          recorder = new MediaRecorder(
            stream,
            {
              mimeType:
                'audio/webm;codecs=opus',
            },
          )
        } catch {
          recorder =
            new MediaRecorder(stream)
        }

        recorderRef.current = recorder
        audioChunksRef.current = []

        recorder.ondataavailable = (
          event,
        ) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data,
            )
          }
        }

        recorder.start()

        setVoiceState(
          VOICE_STATE.LISTENING,
        )
      } catch (err) {
        console.error(
          'Microphone error:',
          err,
        )

        cleanupMic()

        if (
          err.name ===
            'NotAllowedError' ||
          err.name ===
            'PermissionDeniedError'
        ) {
          setMicError(
            'Microphone access was denied. Please allow microphone access and try again.',
          )
        } else if (
          err.name === 'NotFoundError'
        ) {
          setMicError(
            'No microphone was found. Please connect a microphone and try again.',
          )
        } else {
          setMicError(
            err.message ||
              'Unable to access the microphone.',
          )
        }

        setVoiceState(
          VOICE_STATE.READY,
        )
      }
    }, [cleanupMic])

  /* ============================================================
     Process audio + current camera frame
     ============================================================ */

  const processAssistantRequest =
    useCallback(
      async (audioBlob) => {
        if (
          cameraState !==
          CAMERA_STATE.ACTIVE
        ) {
          throw new Error(
            'Enable the camera before asking a visual question.',
          )
        }

        const imageBlob =
          await captureCameraFrame()

        const formData = new FormData()

        formData.append(
          'audio',
          audioBlob,
          'hands-free.webm',
        )

        formData.append(
          'image',
          imageBlob,
          'camera.jpg',
        )

        const response =
          await fetch(
            `${API_BASE_URL}/api/assistant/analyze`,
            {
              method: 'POST',
              body: formData,
            },
          )

        if (!response.ok) {
          let message =
            'VisionX could not process your request.'

          try {
            const errorData =
              await response.json()

            if (
              errorData?.detail
            ) {
              message =
                errorData.detail
            }
          } catch {
            // Keep generic message.
          }

          throw new Error(message)
        }

        return response.json()
      },
      [
        cameraState,
        captureCameraFrame,
      ],
    )

  /* ============================================================
     Play backend TTS audio
     ============================================================ */

  const playResponseAudio =
    useCallback((response) => {
      if (
        !response?.audio ||
        !response?.audio_mime_type
      ) {
        return
      }

      try {
        const binaryString =
          window.atob(response.audio)

        const bytes = new Uint8Array(
          binaryString.length,
        )

        for (
          let i = 0;
          i < binaryString.length;
          i += 1
        ) {
          bytes[i] =
            binaryString.charCodeAt(i)
        }

        const blob = new Blob(
          [bytes],
          {
            type:
              response.audio_mime_type,
          },
        )

        const audioUrl =
          URL.createObjectURL(blob)

        const audio =
          new Audio(audioUrl)

        audio.onended = () => {
          URL.revokeObjectURL(
            audioUrl,
          )
        }

        audio.play().catch(() => {
          URL.revokeObjectURL(
            audioUrl,
          )
        })
      } catch (error) {
        console.error(
          'Unable to play VisionX audio:',
          error,
        )
      }
    }, [])

  /* ============================================================
     Speak quick-action result
     ============================================================ */

  const speakQuickActionResult =
    useCallback((text) => {
      if (
        !text ||
        !('speechSynthesis' in window)
      ) {
        return
      }

      window.speechSynthesis.cancel()

      const utterance =
        new SpeechSynthesisUtterance(text)

      window.speechSynthesis.speak(
        utterance,
      )
    }, [])

  /* ============================================================
     Scan current surroundings via backend
     ============================================================ */

  const handleScanSurroundings =
    useCallback(async () => {
      if (
        cameraState !==
        CAMERA_STATE.ACTIVE
      ) {
        setQuickActionMessage(
          'Enable the camera before scanning your surroundings.',
        )
        return
      }

      setQuickActionLoading('scan')
      setQuickActionMessage(null)

      try {
        const imageBlob =
          await captureCameraFrame()

        const formData = new FormData()

        formData.append(
          'image',
          imageBlob,
          'camera.jpg',
        )

        const response =
          await fetch(
            `${API_BASE_URL}/api/vision/detect`,
            {
              method: 'POST',
              body: formData,
            },
          )

        if (!response.ok) {
          let message =
            'VisionX could not scan the surroundings.'

          try {
            const errorData =
              await response.json()

            if (errorData?.detail) {
              message =
                errorData.detail
            }
          } catch {
            // Keep generic message.
          }

          throw new Error(message)
        }

        const result =
          await response.json()

        const detections =
          Array.isArray(result?.detections)
            ? result.detections
            : []

        if (!detections.length) {
          const message =
            'I could not detect any recognizable objects in the current view.'

          setQuickActionMessage(message)
          speakQuickActionResult(message)
          return
        }

        const positionText = {
          left: 'to your left',
          center: 'directly ahead',
          right: 'to your right',
        }

        const spokenObjects =
          detections.slice(0, 5).map(
            (detection) => {
              const objectName =
                detection.object_name ||
                'Unknown object'

              const position =
                positionText[
                  detection.horizontal
                ] || 'nearby'

              const distance =
                Number.isFinite(
                  detection.distance_m,
                )
                  ? `, about ${detection.distance_m} meters away`
                  : ''

              return `${objectName}, ${position}${distance}`
            },
          )

        const message =
          `I can see ${spokenObjects.join('; ')}.`

        setQuickActionMessage(message)
        speakQuickActionResult(message)

        setAssistantResponse({
          answer: message,
        })
        setVoiceState(
          VOICE_STATE.RESPONSE,
        )
      } catch (error) {
        console.error(
          'Scan surroundings error:',
          error,
        )

        setQuickActionMessage(
          error.message ||
            'VisionX could not scan the surroundings.',
        )
      } finally {
        setQuickActionLoading(null)
      }
    }, [
      cameraState,
      captureCameraFrame,
      speakQuickActionResult,
    ])

  /* ============================================================
     Read visible text via backend OCR
     ============================================================ */

  const handleReadText =
    useCallback(async () => {
      if (
        cameraState !==
        CAMERA_STATE.ACTIVE
      ) {
        setQuickActionMessage(
          'Enable the camera before reading visible text.',
        )
        return
      }

      setQuickActionLoading('read')
      setQuickActionMessage(null)

      try {
        const imageBlob =
          await captureCameraFrame()

        const formData = new FormData()

        formData.append(
          'file',
          imageBlob,
          'camera.jpg',
        )

        const response =
          await fetch(
            `${API_BASE_URL}/api/vision/ocr`,
            {
              method: 'POST',
              body: formData,
            },
          )

        if (!response.ok) {
          let message =
            'VisionX could not read the visible text.'

          try {
            const errorData =
              await response.json()

            if (errorData?.detail) {
              message =
                errorData.detail
            }
          } catch {
            // Keep generic message.
          }

          throw new Error(message)
        }

        const result =
          await response.json()

        const text =
          result?.text ||
          result?.extracted_text ||
          result?.ocr_text ||
          result?.result ||
          ''

        if (
          typeof text !== 'string' ||
          !text.trim()
        ) {
          const message =
            'I could not find readable text in the current view.'

          setQuickActionMessage(message)
          speakQuickActionResult(message)
          return
        }

        const message =
          `The visible text says: ${text.trim()}`

        setQuickActionMessage(message)
        speakQuickActionResult(message)

        setAssistantResponse({
          answer: message,
        })
        setVoiceState(
          VOICE_STATE.RESPONSE,
        )
      } catch (error) {
        console.error(
          'Read text error:',
          error,
        )

        setQuickActionMessage(
          error.message ||
            'VisionX could not read the visible text.',
        )
      } finally {
        setQuickActionLoading(null)
      }
    }, [
      cameraState,
      captureCameraFrame,
      speakQuickActionResult,
    ])

  /* ============================================================
     Stop microphone → real backend processing
     ============================================================ */

  const handleStopListening =
    useCallback(() => {
      const recorder =
        recorderRef.current

      if (
        !recorder ||
        recorder.state !== 'recording'
      ) {
        cleanupMic()

        setVoiceState(
          VOICE_STATE.READY,
        )

        return
      }

      setVoiceState(
        VOICE_STATE.PROCESSING,
      )

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              'audio/webm',
          },
        )

        recorderRef.current = null
        audioChunksRef.current = []

        cleanupMic()

        try {
          const result =
            await processAssistantRequest(
              audioBlob,
            )

          setAssistantResponse(
            result,
          )

          setVoiceState(
            VOICE_STATE.RESPONSE,
          )

          playResponseAudio(result)
        } catch (error) {
          console.error(
            'Hands-Free processing error:',
            error,
          )

          setMicError(
            error.message ||
              'VisionX could not process your request.',
          )

          setVoiceState(
            VOICE_STATE.READY,
          )
        }
      }

      recorder.stop()
    }, [
      cleanupMic,
      processAssistantRequest,
      playResponseAudio,
    ])

  /* ============================================================
     Orb press
     ============================================================ */

  const handleOrbPress =
    useCallback(() => {
      if (
        voiceState ===
          VOICE_STATE.READY ||
        voiceState ===
          VOICE_STATE.RESPONSE
      ) {
        handleTapToSpeak()
      } else if (
        voiceState ===
        VOICE_STATE.LISTENING
      ) {
        handleStopListening()
      }
    }, [
      voiceState,
      handleTapToSpeak,
      handleStopListening,
    ])

  /* ============================================================
     New question
     ============================================================ */

  const handleNewQuestion =
    useCallback(() => {
      setVoiceState(
        VOICE_STATE.READY,
      )

      setMicError(null)
      setAssistantResponse(null)
    }, [])

  /* ============================================================
     Enable camera
     ============================================================ */

  const handleEnableCamera =
    useCallback(async () => {
      setCameraError(null)

      setCameraState(
        CAMERA_STATE.REQUESTING,
      )

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          'Camera access is not supported by your browser.',
        )

        setCameraState(
          CAMERA_STATE.ERROR,
        )

        return
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: {
                  ideal: 'environment',
                },
              },
            },
          )

        camStreamRef.current =
          stream

        /*
         * Do not assign srcObject here.
         *
         * The video element is conditionally rendered
         * only after cameraState becomes ACTIVE.
         *
         * The useEffect above attaches the stream after
         * React mounts the video element.
         */
        setCameraState(
          CAMERA_STATE.ACTIVE,
        )
      } catch (err) {
        console.error(
          'Camera error:',
          err,
        )

        cleanupCamera()

        let message =
          'Unable to access the camera. Check your browser settings.'

        if (
          err.name ===
            'NotAllowedError' ||
          err.name ===
            'PermissionDeniedError'
        ) {
          message =
            'Camera access was denied. Please allow camera access in your browser settings and try again.'
        } else if (
          err.name === 'NotFoundError'
        ) {
          message =
            'No camera was found on this device.'
        } else if (
          err.name ===
          'OverconstrainedError'
        ) {
          message =
            'Unable to find a suitable camera. Please try again.'
        }

        setCameraError(message)

        setCameraState(
          CAMERA_STATE.ERROR,
        )
      }
    }, [cleanupCamera])

  /* ============================================================
     Disable camera
     ============================================================ */

  const handleDisableCamera =
    useCallback(() => {
      cleanupCamera()

      setCameraState(
        CAMERA_STATE.INACTIVE,
      )

      setCameraError(null)
    }, [cleanupCamera])

  /* ============================================================
     Read response aloud
     ============================================================ */

  const handleReadAloud =
    useCallback(() => {
      if (
        assistantResponse?.audio
      ) {
        playResponseAudio(
          assistantResponse,
        )

        return
      }

      if (
        assistantResponse?.answer &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel()

        const utterance =
          new SpeechSynthesisUtterance(
            assistantResponse.answer,
          )

        window.speechSynthesis.speak(
          utterance,
        )
      }
    }, [
      assistantResponse,
      playResponseAudio,
    ])

  /* ============================================================
     Quick actions
     ============================================================ */

  const handleQuickAction =
    useCallback(
      (id) => {
        if (quickActionLoading) {
          return
        }

        if (id === 'scan') {
          handleScanSurroundings()
          return
        }

        if (id === 'read') {
          handleReadText()
          return
        }

        if (id === 'repeat') {
          if (assistantResponse?.audio) {
            handleReadAloud()
            return
          }

          if (assistantResponse?.answer) {
            speakQuickActionResult(
              assistantResponse.answer,
            )
            return
          }

          const message =
            'There is no previous response to repeat.'

          setQuickActionMessage(message)
          speakQuickActionResult(message)
          return
        }

        if (id === 'help') {
          const message =
            'You can ask what is in front of you, scan your surroundings, describe a scene, read visible text, or repeat the last response.'

          setAssistantResponse({
            answer: message,
          })

          setQuickActionMessage(message)
          setVoiceState(
            VOICE_STATE.RESPONSE,
          )
          speakQuickActionResult(message)
        }
      },
      [
        quickActionLoading,
        handleScanSurroundings,
        handleReadText,
        assistantResponse,
        handleReadAloud,
        speakQuickActionResult,
      ],
    )

  /* ============================================================
     Sample command chip
     ============================================================ */

  const handleCommandChip =
    useCallback(() => {
      if (
        voiceState ===
          VOICE_STATE.READY ||
        voiceState ===
          VOICE_STATE.RESPONSE
      ) {
        handleTapToSpeak()
      }
    }, [
      voiceState,
      handleTapToSpeak,
    ])

  /* ============================================================
     Derived values
     ============================================================ */

  const orbHint = {
    [VOICE_STATE.READY]:
      'Tap the microphone to start speaking.',

    [VOICE_STATE.LISTENING]:
      "Listening for your command — tap again when you're done.",

    [VOICE_STATE.PROCESSING]:
      'Sending your voice and current camera view to VisionX…',

    [VOICE_STATE.RESPONSE]:
      'Tap the microphone to ask another question.',
  }[voiceState]

  const voiceCardCls = [
    'hfa-voice-card',

    voiceState ===
    VOICE_STATE.LISTENING
      ? 'hfa-voice-card--listening'
      : '',

    voiceState ===
    VOICE_STATE.PROCESSING
      ? 'hfa-voice-card--processing'
      : '',

    voiceState ===
    VOICE_STATE.RESPONSE
      ? 'hfa-voice-card--response'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const isListening =
    voiceState ===
    VOICE_STATE.LISTENING

  const isProcessing =
    voiceState ===
    VOICE_STATE.PROCESSING

  const isResponse =
    voiceState ===
    VOICE_STATE.RESPONSE

  const isReady =
    voiceState ===
    VOICE_STATE.READY

  /* ============================================================
     Render
     ============================================================ */

  return (
    <main
      className="hfa-page"
      id="main-content"
      aria-label="Hands-Free Assist"
    >
      <div
        className="hfa-page__ambient"
        aria-hidden="true"
      />

      <div className="container hfa-page__body">

        {/* ======================================================
            Hero
            ====================================================== */}

        <header className="hfa-hero">
          <div
            className="hfa-hero__badge"
            role="status"
          >
            <span
              className="hfa-hero__badge-dot"
              aria-hidden="true"
            />

            Voice-First Interaction
          </div>

          <h1 className="hfa-hero__title">
            How can I help?
          </h1>

          <p className="hfa-hero__sub">
            Use your voice to interact with VisionX.
          </p>
        </header>

        {/* ======================================================
            Primary Interaction
            ====================================================== */}

        <div className="hfa-interaction">

          {/* Voice card */}

          <section
            className={voiceCardCls}
            aria-label="Voice interaction control"
          >
            <StateLabel
              voiceState={voiceState}
            />

            <MicOrb
              voiceState={voiceState}
              onPress={handleOrbPress}
            />

            <p
              className="hfa-orb-hint"
              aria-live="polite"
            >
              {orbHint}
            </p>

            {micError && (
              <div
                className="hfa-mic-error"
                role="alert"
                aria-live="assertive"
              >
                <span
                  className="material-symbols-outlined hfa-mic-error__icon"
                  aria-hidden="true"
                >
                  error
                </span>

                <span>{micError}</span>
              </div>
            )}

            {isReady && (
              <button
                type="button"
                className="hfa-btn-speak"
                onClick={handleTapToSpeak}
                aria-label="Tap to speak"
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  mic
                </span>

                Tap to Speak
              </button>
            )}

            {isListening && (
              <button
                type="button"
                className="hfa-btn-stop"
                onClick={
                  handleStopListening
                }
                aria-label="Stop listening"
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  stop_circle
                </span>

                Stop Listening
              </button>
            )}

            {isProcessing && (
              <ProcessingSkeleton
                cameraState={
                  cameraState
                }
              />
            )}

            {isResponse && (
              <>
                <ResponsePanel
                  cameraState={
                    cameraState
                  }
                  response={
                    assistantResponse
                  }
                  onReadAloud={
                    handleReadAloud
                  }
                />

                <button
                  type="button"
                  className="hfa-btn-new"
                  onClick={
                    handleNewQuestion
                  }
                  aria-label="Start a new voice interaction"
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    restart_alt
                  </span>

                  Ask another question
                </button>
              </>
            )}
          </section>

          {/* Camera */}

          <aside
            aria-label="Camera context for voice commands"
          >
            <CameraPanel
              cameraState={
                cameraState
              }
              videoRef={videoRef}
              onEnable={
                handleEnableCamera
              }
              onDisable={
                handleDisableCamera
              }
              cameraError={
                cameraError
              }
            />
          </aside>
        </div>

        {/* ======================================================
            Quick Actions
            ====================================================== */}

        <section
          className="hfa-quick-actions"
          aria-labelledby="quick-actions-label"
        >
          <div
            className="hfa-section-label"
            id="quick-actions-label"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              bolt
            </span>

            Quick actions
          </div>

          {quickActionMessage && (
            <div
              className="hfa-mic-error"
              role="status"
              aria-live="polite"
              style={{ marginBottom: '1rem' }}
            >
              <span
                className="material-symbols-outlined hfa-mic-error__icon"
                aria-hidden="true"
              >
                {quickActionLoading
                  ? 'progress_activity'
                  : 'info'}
              </span>

              <span>{quickActionMessage}</span>
            </div>
          )}

          <div className="hfa-quick-actions__grid">
            {QUICK_ACTIONS.map(
              (action) => (
                <button
                  key={action.id}
                  type="button"
                  className={`hfa-action-btn${
                    action.primary
                      ? ' hfa-action-btn--primary'
                      : ''
                  }`}
                  onClick={() =>
                    handleQuickAction(
                      action.id,
                    )
                  }
                  disabled={
                    Boolean(quickActionLoading) ||
                    voiceState ===
                      VOICE_STATE.PROCESSING
                  }
                  aria-label={`${action.label}: ${action.desc}`}
                >
                  <span
                    className="material-symbols-outlined hfa-action-btn__icon"
                    aria-hidden="true"
                  >
                    {quickActionLoading === action.id
                      ? 'progress_activity'
                      : action.icon}
                  </span>

                  <span className="hfa-action-btn__label">
                    {action.label}
                  </span>

                  <span className="hfa-action-btn__desc">
                    {action.desc}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {/* ======================================================
            Try Saying
            ====================================================== */}

        <section
          className="hfa-try-saying"
          aria-labelledby="try-saying-label"
        >
          <div
            className="hfa-section-label"
            id="try-saying-label"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              tips_and_updates
            </span>

            Try saying — example commands
          </div>

          <div className="hfa-commands-grid">
            {SAMPLE_COMMANDS.map(
              (command) => (
                <button
                  key={command.id}
                  type="button"
                  className="hfa-command-chip"
                  onClick={
                    handleCommandChip
                  }
                  aria-label={`Example command: ${command.text} — tap to try`}
                >
                  <span
                    className="material-symbols-outlined hfa-command-chip__icon"
                    aria-hidden="true"
                  >
                    {command.icon}
                  </span>

                  <span className="hfa-command-chip__text">
                    {command.text}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {/* ======================================================
            How It Works
            ====================================================== */}

        <section
          className="hfa-how-it-works"
          aria-labelledby="how-it-works-label"
        >
          <div
            className="hfa-section-label"
            id="how-it-works-label"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              schema
            </span>

            How Hands-Free Assist works
          </div>

          <div
            className="hfa-flow"
            role="list"
          >
            {FLOW_STEPS.map(
              (step, index) => (
                <Fragment
                  key={step.id}
                >
                  <div
                    className="hfa-flow-step"
                    role="listitem"
                  >
                    <div
                      className="hfa-flow-step__icon"
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined">
                        {step.icon}
                      </span>
                    </div>

                    <span className="hfa-flow-step__title">
                      {step.title}
                    </span>

                    <span className="hfa-flow-step__desc">
                      {step.desc}
                    </span>
                  </div>

                  {index <
                    FLOW_STEPS.length -
                      1 && (
                    <div
                      className="hfa-flow-arrow"
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    </div>
                  )}
                </Fragment>
              ),
            )}
          </div>

          <div
            className="hfa-how-future-note"
            role="note"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              info
            </span>

            Voice, camera, vision,
            spatial reasoning, and
            response generation are
            connected to the VisionX
            backend.
          </div>
        </section>

      </div>
    </main>
  )
}