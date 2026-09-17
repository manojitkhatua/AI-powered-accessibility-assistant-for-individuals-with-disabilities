/**
 * VisionX — Vision Assist Page
 * Main interface for AI-powered visual assistance with live camera & image/document upload.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import './VisionAssistPage.css'

const BACKEND_URL = 'http://localhost:8000'

export default function VisionAssistPage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const capturedAudioRef = useRef(null)
  const audioPlayerRef = useRef(null)

  const liveAnalysisIntervalRef = useRef(null)
  const liveAnalysisInProgressRef = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [assistantAudioUrl, setAssistantAudioUrl] = useState(null)
  const [assistantMessage, setAssistantMessage] = useState('')

  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [isFileConfirmed, setIsFileConfirmed] = useState(false)

  const [liveDetections, setLiveDetections] = useState([])
  const [liveAnalysisError, setLiveAnalysisError] = useState(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop()
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      if (assistantAudioUrl) {
        URL.revokeObjectURL(assistantAudioUrl)
      }
    }
  }, [previewUrl, assistantAudioUrl])

  const startRecording = async () => {
    setAnalysisError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setAnalysisError(
        'Microphone access is not supported by your browser.'
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        capturedAudioRef.current = new Blob(
          audioChunksRef.current,
          {
            type: recorder.mimeType || 'audio/webm',
          }
        )

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      setAnalysisError(
        'Unable to access the microphone. Please check browser permissions.'
      )
    }
  }

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
  }

  const captureCameraFrame = useCallback(() => {
    if (!videoRef.current || !cameraActive) {
      return null
    }

    const video = videoRef.current

    if (!video.videoWidth || !video.videoHeight) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })
}, [cameraActive])
  const analyzeLiveFrame = useCallback(async () => {
  if (
    !cameraActive ||
    !videoRef.current ||
    liveAnalysisInProgressRef.current
  ) {
    return
  }

  liveAnalysisInProgressRef.current = true

  try {
    const imageBlob = await captureCameraFrame()

    if (!imageBlob) {
      return
    }

    const formData = new FormData()
    formData.append('file', imageBlob, 'live-frame.jpg')

    const response = await fetch(
      `${BACKEND_URL}/api/vision/detect`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (!response.ok) {
      throw new Error(
        `Live vision request failed with status ${response.status}`,
      )
    }

    const data = await response.json()

    setLiveDetections(data.detections || [])
    setLiveAnalysisError(null)
  } catch (err) {
    console.error('Live vision analysis error:', err)
    setLiveAnalysisError(
      'Live vision analysis is temporarily unavailable.',
    )
  } finally {
    liveAnalysisInProgressRef.current = false
  }
}, [cameraActive, captureCameraFrame])

useEffect(() => {
  if (!cameraActive) {
    if (liveAnalysisIntervalRef.current) {
      clearInterval(liveAnalysisIntervalRef.current)
      liveAnalysisIntervalRef.current = null
    }

    liveAnalysisInProgressRef.current = false

    return undefined
  }

  liveAnalysisIntervalRef.current = setInterval(
    analyzeLiveFrame,
    2500,
  )

  return () => {
    if (liveAnalysisIntervalRef.current) {
      clearInterval(liveAnalysisIntervalRef.current)
      liveAnalysisIntervalRef.current = null
    }

    liveAnalysisInProgressRef.current = false
  }
}, [cameraActive, analyzeLiveFrame])
  const getRecordedAudio = () =>
    new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive'
      ) {
        resolve(capturedAudioRef.current)
        return
      }

      const recorder = mediaRecorderRef.current

      recorder.addEventListener(
        'stop',
        () => {
          resolve(capturedAudioRef.current)
        },
        { once: true }
      )

      recorder.stop()
    })

  const analyzeVision = async (imageBlob, audioBlob) => {
    setAnalysisError(null)
    setIsAnalyzing(true)
    setAssistantMessage('')

    try {
      if (!audioBlob) {
        throw new Error('Please record a question first.')
      }

      if (!imageBlob) {
        throw new Error('No image is available for analysis.')
      }

      const formData = new FormData()

      formData.append('audio', audioBlob, 'question.webm')
      formData.append('image', imageBlob, 'camera-frame.jpg')

      const response = await fetch(
        `${BACKEND_URL}/api/assistant/analyze`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(
          `Assistant request failed with status ${response.status}.`
        )
      }

      const result = await response.json()

setAssistantMessage(
  result.answer || 'No answer was generated.',
)

if (result.audio) {
  const audioBytes = Uint8Array.from(
    atob(result.audio),
    (character) => character.charCodeAt(0),
  )

  const audioBlob = new Blob(
    [audioBytes],
    {
      type: result.audio_mime_type || 'audio/wav',
    },
  )

  const audioUrl = URL.createObjectURL(audioBlob)

    setAssistantAudioUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }

      return audioUrl
    })

    if (audioPlayerRef.current) {
      audioPlayerRef.current.load()

      try {
        await audioPlayerRef.current.play()
      } catch (err) {
        console.error('Audio playback error:', err)
      }
    }
  }

      capturedAudioRef.current = null
    } catch (err) {
      console.error('Vision analysis error:', err)
      setAnalysisError(
        err.message || 'VisionX could not process the request.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAskVision = async () => {
    if (isAnalyzing) {
      return
    }

    if (!isRecording) {
      await startRecording()
      return
    }

    const audioBlob = await getRecordedAudio()

    const imageBlob = cameraActive
      ? await captureCameraFrame()
      : uploadedFile

    await analyzeVision(imageBlob, audioBlob)
  }

  const handleStartCamera = async () => {
    setCameraError(null)
    setFileError(null)
    setAnalysisError(null)

    if (uploadedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setUploadedFile(null)
      setPreviewUrl(null)
      setIsFileConfirmed(false)
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera access is not supported by your browser or environment.'
      )
      return
    }

    try {
      setCameraLoading(true)

      let stream

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        try {
          await videoRef.current.play()
        } catch (err) {
          console.error('Video play error:', err)
        }
      }

      setCameraActive(true)
      setCameraLoading(false)
    } catch (err) {
      console.error('Camera access error:', err)

      setCameraLoading(false)
      setCameraActive(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setCameraError(
          'Camera access was denied. Please allow camera permissions in your browser address bar to use Vision Assist.'
        )
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        setCameraError('No camera device was detected on your system.')
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        setCameraError(
          'Your camera is currently in use by another application or browser tab.'
        )
      } else if (err.name === 'OverconstrainedError') {
        setCameraError(
          'The requested camera settings are not supported by your camera hardware.'
        )
      } else {
        setCameraError(
          'Unable to start the camera. Please check your permissions and try again.'
        )
      }
    }
  }

  const handleStopCamera = () => {
    if (isRecording) {
      stopRecording()
      capturedAudioRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
    setLiveDetections([])
    setLiveAnalysisError(null)
    setCameraLoading(false)
  }

  const handleOpenFileDialog = () => {
    setFileError(null)
    setCameraError(null)

    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileError(null)
    setCameraError(null)
    setAnalysisError(null)

    if (cameraActive) {
      handleStopCamera()
    }

    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]

    const fileName = file.name.toLowerCase()

    const isValidExtension =
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.pdf')

    if (
      !validMimeTypes.includes(file.type) &&
      !isValidExtension
    ) {
      setFileError(
        'Unsupported file format. Please select a valid image (JPG, PNG, WebP) or PDF document.'
      )

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const isPdf =
      file.type === 'application/pdf' ||
      fileName.endsWith('.pdf')

    let objectUrl = null

    if (!isPdf) {
      try {
        objectUrl = URL.createObjectURL(file)
      } catch {
        setFileError(
          'Unable to generate preview for this image. Please try another file.'
        )
        return
      }
    }

    setIsFileConfirmed(false)
    setUploadedFile(file)
    setPreviewUrl(objectUrl)
    setAssistantMessage('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmAndAnalyze = () => {
    setIsFileConfirmed(true)
    setAnalysisError(null)
  }

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setUploadedFile(null)
    setPreviewUrl(null)
    setFileError(null)
    setIsFileConfirmed(false)
    setAssistantMessage('')
    capturedAudioRef.current = null

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) {
      return '0 B'
    }

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +
      ' ' +
      sizes[i]
    )
  }

  const getFileTypeLabel = (file) => {
    if (!file) {
      return ''
    }

    const name = file.name.toLowerCase()

    if (
      file.type === 'application/pdf' ||
      name.endsWith('.pdf')
    ) {
      return 'PDF Document'
    }

    if (
      file.type === 'image/png' ||
      name.endsWith('.png')
    ) {
      return 'PNG Image'
    }

    if (
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg')
    ) {
      return 'JPEG Image'
    }

    if (
      file.type === 'image/webp' ||
      name.endsWith('.webp')
    ) {
      return 'WebP Image'
    }

    return file.type || 'Document File'
  }

  const isPdf =
    uploadedFile &&
    (
      uploadedFile.type === 'application/pdf' ||
      uploadedFile.name.toLowerCase().endsWith('.pdf')
    )

 return (
  <main className="main vision-assist-page" id="main-content">
    <div
      className="vision-assist__ambient"
      aria-hidden="true"
    />

    <div className="container vision-assist__inner">
      <audio
        ref={audioPlayerRef}
        src={assistantAudioUrl || undefined}
        hidden
      />

      <header className="vision-assist__header">
        <div className="vision-assist__badge" role="status">
          <span
            className="vision-assist__badge-dot"
            aria-hidden="true"
          />
          <span>Vision Assist Modality</span>
        </div>

        <h1 className="vision-assist__title">
          Understand your surroundings
        </h1>

        <p className="vision-assist__subtitle">
          Use VisionX to understand objects, people, and important
          details around you.
        </p>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only-input"
        tabIndex={-1}
        aria-label="Upload image or document file"
      />

      <div className="vision-assist__layout">
        <section
          className={`vision-viewport ${
            cameraActive ? 'vision-viewport--live' : ''
          } ${
            uploadedFile
              ? 'vision-viewport--file-loaded'
              : ''
          }`}
          aria-labelledby="viewport-title"
        >
          <div className="vision-viewport__header">
            <div
              className="vision-viewport__status"
              role="status"
              aria-live="polite"
            >
              <span
                className={`vision-viewport__status-dot ${
                  cameraActive
                    ? 'vision-viewport__status-dot--live'
                    : uploadedFile
                      ? isFileConfirmed
                        ? 'vision-viewport__status-dot--confirmed'
                        : 'vision-viewport__status-dot--file'
                      : ''
                }`}
                aria-hidden="true"
              />

              <span className="vision-viewport__status-text">
                {cameraLoading
                  ? 'Connecting Camera...'
                  : isAnalyzing
                    ? 'Analyzing...'
                    : isRecording
                      ? 'Listening...'
                      : cameraActive
                        ? 'Camera Live'
                        : uploadedFile
                          ? isFileConfirmed
                            ? 'Ready for Analysis'
                            : isPdf
                              ? 'PDF Document Selected'
                              : 'Image File Selected'
                          : cameraError
                            ? 'Camera Unavailable'
                            : fileError
                              ? 'Upload Error'
                              : 'Optical Sensor Ready'}
              </span>
            </div>

            <div
              className="vision-viewport__lens-tag"
              aria-hidden="true"
            >
              {cameraActive
                ? isRecording
                  ? 'Recording Question'
                  : isAnalyzing
                    ? 'Processing'
                    : 'Live Video Feed'
                : uploadedFile
                  ? isFileConfirmed
                    ? `Ready • ${getFileTypeLabel(uploadedFile)}`
                    : `Preview • ${getFileTypeLabel(uploadedFile)}`
                  : '1080p • Live Field'}
            </div>
          </div>

          <div className="vision-viewport__screen">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`vision-viewport__video ${
                cameraActive
                  ? 'vision-viewport__video--active'
                  : ''
              }`}
              aria-label="Live camera viewfinder feed"
            />

            {uploadedFile && !isPdf && previewUrl && (
              <div className="vision-viewport__image-container">
                <img
                  src={previewUrl}
                  alt={`Selected preview for visual assistance: ${uploadedFile.name}`}
                  className="vision-viewport__image-preview"
                />

                {isFileConfirmed && (
                  <div
                    className="vision-viewport__ready-pill"
                    role="status"
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      task_alt
                    </span>

                    <span>Ready for Analysis</span>
                  </div>
                )}
              </div>
            )}

            {uploadedFile && isPdf && (
              <div
                className="vision-viewport__doc-preview"
                role="region"
                aria-label="Loaded PDF Document"
              >
                <div
                  className="vision-viewport__doc-icon-wrap"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined">
                    picture_as_pdf
                  </span>
                </div>

                <h3 className="vision-viewport__doc-title">
                  {uploadedFile.name}
                </h3>

                <div className="vision-viewport__doc-meta">
                  <span className="tag tag--pdf">
                    PDF Document
                  </span>

                  <span>
                    {formatFileSize(uploadedFile.size)}
                  </span>
                </div>

                <p
                  className={`vision-viewport__doc-status ${
                    isFileConfirmed
                      ? 'vision-viewport__doc-status--confirmed'
                      : ''
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    {isFileConfirmed
                      ? 'task_alt'
                      : 'touch_app'}
                  </span>

                  {isFileConfirmed
                    ? 'Ready for Analysis'
                    : 'File selected — click Confirm & Analyze'}
                </p>
              </div>
            )}

            <div
              className="vision-viewport__reticle"
              aria-hidden="true"
            >
              <span className="reticle-corner reticle-corner--tl" />
              <span className="reticle-corner reticle-corner--tr" />
              <span className="reticle-corner reticle-corner--bl" />
              <span className="reticle-corner reticle-corner--br" />
            </div>

            {cameraError && (
              <div
                className="vision-viewport__error-banner"
                role="alert"
              >
                <span
                  className="material-symbols-outlined vision-viewport__error-icon"
                  aria-hidden="true"
                >
                  videocam_off
                </span>

                <div className="vision-viewport__error-body">
                  <strong className="vision-viewport__error-title">
                    Camera Notice
                  </strong>

                  <p className="vision-viewport__error-desc">
                    {cameraError}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--sm vision-viewport__error-dismiss"
                  onClick={() => setCameraError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {fileError && (
              <div
                className="vision-viewport__error-banner"
                role="alert"
              >
                <span
                  className="material-symbols-outlined vision-viewport__error-icon"
                  aria-hidden="true"
                >
                  error_outline
                </span>

                <div className="vision-viewport__error-body">
                  <strong className="vision-viewport__error-title">
                    File Notice
                  </strong>

                  <p className="vision-viewport__error-desc">
                    {fileError}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--sm vision-viewport__error-dismiss"
                  onClick={() => setFileError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {analysisError && (
              <div
                className="vision-viewport__error-banner"
                role="alert"
              >
                <span
                  className="material-symbols-outlined vision-viewport__error-icon"
                  aria-hidden="true"
                >
                  error_outline
                </span>

                <div className="vision-viewport__error-body">
                  <strong className="vision-viewport__error-title">
                    VisionX Notice
                  </strong>

                  <p className="vision-viewport__error-desc">
                    {analysisError}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--sm vision-viewport__error-dismiss"
                  onClick={() => setAnalysisError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* LIVE VISION RESULTS */}
            {cameraActive && (
              <div
                className="vision-viewport__live-results"
                role="region"
                aria-label="Live Vision Results"
                aria-live="polite"
              >
                <div className="vision-viewport__live-results-header">
                  <div>
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      visibility
                    </span>

                    <strong>Live Vision</strong>
                  </div>

                  <span className="vision-viewport__live-indicator">
                    <span aria-hidden="true" />
                    LIVE
                  </span>
                </div>

                {liveAnalysisError ? (
                  <p className="vision-viewport__live-empty">
                    {liveAnalysisError}
                  </p>
                ) : liveDetections.length === 0 ? (
                  <p className="vision-viewport__live-empty">
                    Looking for objects...
                  </p>
                ) : (
                  <div className="vision-viewport__live-detections">
                    {liveDetections.map((detection, index) => (
                      <div
                        className="vision-viewport__live-detection"
                        key={`${detection.object_name}-${index}`}
                      >
                        <div>
                          <span
                            className="material-symbols-outlined"
                            aria-hidden="true"
                          >
                            category
                          </span>

                          <strong>
                            {detection.object_name}
                          </strong>
                        </div>

                        <span className="vision-viewport__live-position">
                          {detection.horizontal}
                        </span>

                        <span className="vision-viewport__live-confidence">
                          {Math.round(
                            detection.confidence * 100,
                          )}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!cameraActive && !uploadedFile && (
              <div className="vision-viewport__empty-state">
                <div
                  className="vision-viewport__icon-wrap"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined">
                    {cameraLoading
                      ? 'hourglass_top'
                      : 'center_focus_strong'}
                  </span>
                </div>

                <h2
                  className="vision-viewport__empty-title"
                  id="viewport-title"
                >
                  {cameraLoading
                    ? 'Starting camera stream...'
                    : 'Ready to understand your surroundings'}
                </h2>

                <p className="vision-viewport__empty-desc">
                  {cameraLoading
                    ? 'Please accept the browser camera prompt to begin.'
                    : 'Start your camera or upload an image to begin.'}
                </p>

                <div className="vision-viewport__actions">
                  <button
                    type="button"
                    className="btn btn--primary vision-viewport__btn"
                    onClick={handleStartCamera}
                    disabled={cameraLoading}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      photo_camera
                    </span>

                    <span>
                      {cameraLoading
                        ? 'Starting...'
                        : 'Start Camera'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary vision-viewport__btn"
                    onClick={handleOpenFileDialog}
                    disabled={cameraLoading}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      upload_file
                    </span>

                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div
                className="vision-viewport__live-hud"
                role="region"
                aria-label="Camera Controls"
              >
                <button
                  type="button"
                  className="btn btn--primary vision-viewport__confirm-btn"
                  onClick={handleAskVision}
                  disabled={isAnalyzing}
                  aria-label={
                    isRecording
                      ? 'Stop recording and analyze'
                      : 'Ask VisionX a question'
                  }
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    {isRecording ? 'stop' : 'mic'}
                  </span>

                  <span>
                    {isAnalyzing
                      ? 'Analyzing...'
                      : isRecording
                        ? 'Stop & Analyze'
                        : 'Ask VisionX'}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn--secondary vision-viewport__stop-btn"
                  onClick={handleStopCamera}
                  disabled={isRecording || isAnalyzing}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    videocam_off
                  </span>

                  <span>Stop Camera</span>
                </button>
              </div>
            )}

            {uploadedFile && (
              <div
                className={`vision-viewport__file-hud ${
                  isFileConfirmed
                    ? 'vision-viewport__file-hud--confirmed'
                    : ''
                }`}
                role="region"
                aria-label="Uploaded file controls"
              >
                <div className="vision-viewport__file-info">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    {isPdf ? 'description' : 'image'}
                  </span>

                  <span
                    className="vision-viewport__file-name"
                    title={uploadedFile.name}
                  >
                    {uploadedFile.name}
                  </span>

                  <span className="vision-viewport__file-size">
                    ({formatFileSize(uploadedFile.size)})
                  </span>
                </div>

                <div className="vision-viewport__file-actions">
                  {!isFileConfirmed ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm vision-viewport__confirm-btn"
                      onClick={handleConfirmAndAnalyze}
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        check_circle
                      </span>

                      <span>Confirm & Analyze</span>
                    </button>
                  ) : (
                    <>
                      <div
                        className="vision-viewport__confirmed-badge"
                        role="status"
                      >
                        <span
                          className="material-symbols-outlined"
                          aria-hidden="true"
                        >
                          task_alt
                        </span>

                        <span>Ready for Analysis</span>
                      </div>

                      {!isPdf && (
                        <button
                          type="button"
                          className="btn btn--primary btn--sm vision-viewport__confirm-btn"
                          onClick={handleAskVision}
                          disabled={isAnalyzing}
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden="true"
                          >
                            {isRecording ? 'stop' : 'mic'}
                          </span>

                          <span>
                            {isAnalyzing
                              ? 'Analyzing...'
                              : isRecording
                                ? 'Stop & Analyze'
                                : 'Ask VisionX'}
                          </span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn--secondary btn--sm vision-viewport__file-btn"
                    onClick={handleOpenFileDialog}
                    disabled={isAnalyzing}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      sync
                    </span>

                    <span>
                      {isFileConfirmed
                        ? 'Change File'
                        : 'Change'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary btn--sm vision-viewport__file-btn vision-viewport__file-btn--clear"
                    onClick={handleClearFile}
                    disabled={isAnalyzing}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      close
                    </span>

                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="vision-viewport__footer">
            <span className="vision-viewport__hint">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                info
              </span>

              {isRecording
                ? 'Listening. Ask VisionX what you want to know about the scene.'
                : isAnalyzing
                  ? 'VisionX is processing your question and visual information.'
                  : cameraActive
                    ? 'Live Vision is continuously checking the camera. Ask VisionX when you need a spoken answer.'
                    : uploadedFile
                      ? isFileConfirmed
                        ? 'Image confirmed. Click Ask VisionX and speak your question.'
                        : 'File preview loaded. Review and click Confirm & Analyze.'
                      : 'Supported formats: JPG, PNG, WebP images and PDF documents.'}
            </span>
          </div>
        </section>

        <section
          className="vision-result"
          aria-labelledby="vision-result-title"
        >
          <div className="vision-result__card">
            <div className="vision-result__header">
              <div className="vision-result__title-wrap">
                <span
                  className="material-symbols-outlined vision-result__icon"
                  aria-hidden="true"
                >
                  psychology
                </span>

                <h2
                  className="vision-result__title"
                  id="vision-result-title"
                >
                  VisionX Result
                </h2>
              </div>

              {isAnalyzing && (
                <span
                  className="sample-badge"
                  aria-label="VisionX is processing"
                >
                  <span
                    className="sample-badge__dot"
                    aria-hidden="true"
                  />

                  Processing
                </span>
              )}
            </div>

            {analysisError ? (
              <div
                className="vision-result__empty"
                role="alert"
              >
                <span
                  className="material-symbols-outlined vision-result__empty-icon"
                  aria-hidden="true"
                >
                  error_outline
                </span>

                <p className="vision-result__empty-text">
                  {analysisError}
                </p>
              </div>
            ) : assistantMessage ? (
              <div
                className="vision-result__content"
                role="region"
                aria-live="polite"
              >
                <div className="vision-result__demo-alert">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    auto_awesome
                  </span>

                  <p className="vision-result__main-desc">
                    {assistantMessage}
                  </p>
                </div>

                {assistantAudioUrl && (
                  <div className="vision-result__breakdown">
                    <h3 className="vision-result__breakdown-title">
                      Assistant Response
                    </h3>

                    <div className="result-item">
                      <div
                        className="result-item__icon-wrap"
                        aria-hidden="true"
                      >
                        <span className="material-symbols-outlined">
                          volume_up
                        </span>
                      </div>

                      <div className="result-item__text">
                        <strong className="result-item__label">
                          Spoken Response
                        </strong>

                        <span className="result-item__val">
                          VisionX has generated an
                          accessibility-focused spoken response.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="vision-result__disclaimer">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    info
                  </span>

                  <span>
                    Results are generated from the current image
                    and spoken question. Distance values are
                    estimates.
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="vision-result__empty"
                role="status"
              >
                <span
                  className="material-symbols-outlined vision-result__empty-icon"
                  aria-hidden="true"
                >
                  visibility_off
                </span>

                <p className="vision-result__empty-text">
                  Your visual insight will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  </main>
  )
}