/**
 * VisionX — Vision Assist Page
 * Main interface for AI-powered visual assistance with live camera & image/document upload
 */

import { useState, useRef, useEffect } from 'react'
import './VisionAssistPage.css'

export default function VisionAssistPage({ onBack }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [isFileConfirmed, setIsFileConfirmed] = useState(false)

  const [hasSampleInsight, setHasSampleInsight] = useState(true)

  // Clean up camera streams and preview object URLs on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Start real device camera via navigator.mediaDevices.getUserMedia
  const handleStartCamera = async () => {
    setCameraError(null)
    setFileError(null)

    // Clear any uploaded file when starting camera
    if (uploadedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadedFile(null)
      setPreviewUrl(null)
      setIsFileConfirmed(false)
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.')
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
      } catch (firstErr) {
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
        } catch (playErr) {
          console.error('Video play error:', playErr)
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

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access was denied. Please allow camera permissions in your browser address bar to use Vision Assist.'
        )
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your system.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Your camera is currently in use by another application or browser tab.')
      } else if (err.name === 'OverconstrainedError') {
        setCameraError('The requested camera settings are not supported by your camera hardware.')
      } else {
        setCameraError('Unable to start the camera. Please check your permissions and try again.')
      }
    }
  }

  // Stop camera tracks cleanly and reset video feed
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
    setCameraLoading(false)
  }

  // Open native File Explorer
  const handleOpenFileDialog = () => {
    setFileError(null)
    setCameraError(null)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle file selection from File Explorer
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    setFileError(null)
    setCameraError(null)

    // Stop camera if active
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

    if (!validMimeTypes.includes(file.type) && !isValidExtension) {
      setFileError(
        'Unsupported file format. Please select a valid image (JPG, PNG, WebP) or PDF document.'
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Revoke previous URL if any
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')
    let objectUrl = null

    if (!isPdf) {
      try {
        objectUrl = URL.createObjectURL(file)
      } catch (err) {
        setFileError('Unable to generate preview for this image. Please try another file.')
        return
      }
    }

    // Reset confirmation state for new file
    setIsFileConfirmed(false)
    setUploadedFile(file)
    setPreviewUrl(objectUrl)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle user confirmation of selected file for AI analysis
  const handleConfirmAndAnalyze = () => {
    // BACKEND REQUIRED: Upload the confirmed image/document to the AI vision processing API and receive accessibility-friendly analysis results.
    setIsFileConfirmed(true)
  }

  // Clear/remove currently selected file
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setUploadedFile(null)
    setPreviewUrl(null)
    setFileError(null)
    setIsFileConfirmed(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helpers for file metadata
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileTypeLabel = (file) => {
    if (!file) return ''
    const name = file.name.toLowerCase()
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'PDF Document'
    if (file.type === 'image/png' || name.endsWith('.png')) return 'PNG Image'
    if (file.type === 'image/jpeg' || file.type === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg'))
      return 'JPEG Image'
    if (file.type === 'image/webp' || name.endsWith('.webp')) return 'WebP Image'
    return file.type || 'Document File'
  }

  const isPdf =
    uploadedFile &&
    (uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf'))

  return (
    <main className="main vision-assist-page" id="main-content">
      <div className="vision-assist__ambient" aria-hidden="true" />
      <div className="container vision-assist__inner">
        {/* Page Header */}
        <header className="vision-assist__header">
          <div className="vision-assist__badge" role="status">
            <span className="vision-assist__badge-dot" aria-hidden="true" />
            <span>Vision Assist Modality</span>
          </div>
          <h1 className="vision-assist__title">
            Understand your surroundings
          </h1>
          <p className="vision-assist__subtitle">
            Use VisionX to understand objects, people, and important details around you.
          </p>
        </header>

        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only-input"
          tabIndex={-1}
          aria-label="Upload image or document file"
        />

        {/* Main Workspace Layout */}
        <div className="vision-assist__layout">
          {/* Central Camera / Visual Area */}
          <section
            className={`vision-viewport ${cameraActive ? 'vision-viewport--live' : ''} ${
              uploadedFile ? 'vision-viewport--file-loaded' : ''
            }`}
            aria-labelledby="viewport-title"
          >
            <div className="vision-viewport__header">
              <div className="vision-viewport__status" role="status" aria-live="polite">
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
              <div className="vision-viewport__lens-tag" aria-hidden="true">
                {cameraActive
                  ? 'Live Video Feed'
                  : uploadedFile
                  ? isFileConfirmed
                    ? `Ready • ${getFileTypeLabel(uploadedFile)}`
                    : `Preview • ${getFileTypeLabel(uploadedFile)}`
                  : '1080p • 60 FPS Field'}
              </div>
            </div>

            <div className="vision-viewport__screen">
              {/* Real Video Element for Live Camera Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`vision-viewport__video ${cameraActive ? 'vision-viewport__video--active' : ''}`}
                aria-label="Live camera viewfinder feed"
              />

              {/* Uploaded Image Preview */}
              {uploadedFile && !isPdf && previewUrl && (
                <div className="vision-viewport__image-container">
                  <img
                    src={previewUrl}
                    alt={`Selected preview for visual assistance: ${uploadedFile.name}`}
                    className="vision-viewport__image-preview"
                  />
                  {isFileConfirmed && (
                    <div className="vision-viewport__ready-pill" role="status">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        task_alt
                      </span>
                      <span>Ready for Analysis</span>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded PDF / Document Card View */}
              {uploadedFile && isPdf && (
                <div className="vision-viewport__doc-preview" role="region" aria-label="Loaded PDF Document">
                  <div className="vision-viewport__doc-icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <h3 className="vision-viewport__doc-title">{uploadedFile.name}</h3>
                  <div className="vision-viewport__doc-meta">
                    <span className="tag tag--pdf">PDF Document</span>
                    <span>{formatFileSize(uploadedFile.size)}</span>
                  </div>
                  <p
                    className={`vision-viewport__doc-status ${
                      isFileConfirmed ? 'vision-viewport__doc-status--confirmed' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {isFileConfirmed ? 'task_alt' : 'touch_app'}
                    </span>
                    {isFileConfirmed
                      ? 'Ready for Analysis'
                      : 'File selected — click Confirm & Analyze'}
                  </p>
                </div>
              )}

              {/* Target / Focus reticle aesthetic */}
              <div className="vision-viewport__reticle" aria-hidden="true">
                <span className="reticle-corner reticle-corner--tl" />
                <span className="reticle-corner reticle-corner--tr" />
                <span className="reticle-corner reticle-corner--bl" />
                <span className="reticle-corner reticle-corner--br" />
              </div>

              {/* Camera Error Message Banner */}
              {cameraError && (
                <div className="vision-viewport__error-banner" role="alert">
                  <span className="material-symbols-outlined vision-viewport__error-icon" aria-hidden="true">
                    videocam_off
                  </span>
                  <div className="vision-viewport__error-body">
                    <strong className="vision-viewport__error-title">Camera Notice</strong>
                    <p className="vision-viewport__error-desc">{cameraError}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm vision-viewport__error-dismiss"
                    onClick={() => setCameraError(null)}
                    aria-label="Dismiss camera notice"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* File Error Message Banner */}
              {fileError && (
                <div className="vision-viewport__error-banner" role="alert">
                  <span className="material-symbols-outlined vision-viewport__error-icon" aria-hidden="true">
                    error_outline
                  </span>
                  <div className="vision-viewport__error-body">
                    <strong className="vision-viewport__error-title">File Notice</strong>
                    <p className="vision-viewport__error-desc">{fileError}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm vision-viewport__error-dismiss"
                    onClick={() => setFileError(null)}
                    aria-label="Dismiss file notice"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Inactive Initial Empty State */}
              {!cameraActive && !uploadedFile && (
                <div className="vision-viewport__empty-state">
                  <div className="vision-viewport__icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      {cameraLoading ? 'hourglass_top' : 'center_focus_strong'}
                    </span>
                  </div>
                  <h2 className="vision-viewport__empty-title" id="viewport-title">
                    {cameraLoading ? 'Starting camera stream...' : 'Ready to understand your surroundings'}
                  </h2>
                  <p className="vision-viewport__empty-desc">
                    {cameraLoading
                      ? 'Please accept the browser camera prompt to begin.'
                      : 'Start your camera or upload an image to begin.'}
                  </p>

                  {/* Initial Controls */}
                  <div className="vision-viewport__actions">
                    <button
                      type="button"
                      className="btn btn--primary vision-viewport__btn"
                      onClick={handleStartCamera}
                      disabled={cameraLoading}
                      aria-label="Start Camera feed"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        photo_camera
                      </span>
                      <span>{cameraLoading ? 'Starting...' : 'Start Camera'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn--secondary vision-viewport__btn"
                      onClick={handleOpenFileDialog}
                      disabled={cameraLoading}
                      aria-label="Open File Explorer to upload image or document"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        upload_file
                      </span>
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Overlay Controls when Camera is Running */}
              {cameraActive && (
                <div className="vision-viewport__live-hud" role="region" aria-label="Camera Controls">
                  <button
                    type="button"
                    className="btn btn--secondary vision-viewport__stop-btn"
                    onClick={handleStopCamera}
                    aria-label="Stop Camera feed"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      videocam_off
                    </span>
                    <span>Stop Camera</span>
                  </button>
                </div>
              )}

              {/* Uploaded File Overlay Controls & Confirmation Step */}
              {uploadedFile && (
                <div
                  className={`vision-viewport__file-hud ${
                    isFileConfirmed ? 'vision-viewport__file-hud--confirmed' : ''
                  }`}
                  role="region"
                  aria-label="Uploaded file controls and confirmation"
                >
                  <div className="vision-viewport__file-info">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {isPdf ? 'description' : 'image'}
                    </span>
                    <span className="vision-viewport__file-name" title={uploadedFile.name}>
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
                        aria-label="Confirm selected file and prepare for analysis"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          check_circle
                        </span>
                        <span>Confirm & Analyze</span>
                      </button>
                    ) : (
                      <div className="vision-viewport__confirmed-badge" role="status">
                        <span className="material-symbols-outlined" aria-hidden="true">
                          task_alt
                        </span>
                        <span>Ready for Analysis</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn--secondary btn--sm vision-viewport__file-btn"
                      onClick={handleOpenFileDialog}
                      aria-label="Choose a different image or document"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        sync
                      </span>
                      <span>{isFileConfirmed ? 'Change File' : 'Change'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm vision-viewport__file-btn vision-viewport__file-btn--clear"
                      onClick={handleClearFile}
                      aria-label="Remove selected file"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
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
                <span className="material-symbols-outlined" aria-hidden="true">info</span>
                {cameraActive
                  ? 'Camera active. Frame is positioned for live environmental awareness.'
                  : uploadedFile
                  ? isFileConfirmed
                    ? 'File confirmed. Ready for AI accessibility analysis once connected to processing engine.'
                    : 'File preview loaded. Review and click "Confirm & Analyze" to prepare file for analysis.'
                  : 'Supported formats: JPG, PNG, WebP images and PDF documents.'}
              </span>
            </div>
          </section>

          {/* Result Section */}
          <section
            className="vision-result"
            aria-labelledby="vision-result-title"
          >
            <div className="vision-result__card">
              <div className="vision-result__header">
                <div className="vision-result__title-wrap">
                  <span className="material-symbols-outlined vision-result__icon" aria-hidden="true">
                    psychology
                  </span>
                  <h2 className="vision-result__title" id="vision-result-title">
                    VisionX Result
                  </h2>
                </div>
                {hasSampleInsight && (
                  <span className="sample-badge" aria-label="Sample demonstration result">
                    <span className="sample-badge__dot" aria-hidden="true" />
                    Sample Result
                  </span>
                )}
              </div>

              {/* BACKEND REQUIRED: Send captured image/frame to AI vision model for analysis. */}
              {/* BACKEND REQUIRED: Receive and display structured accessibility-friendly vision results. */}
              {hasSampleInsight ? (
                <div className="vision-result__content" role="region" aria-live="polite">
                  <div className="vision-result__demo-alert" role="note">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      auto_awesome
                    </span>
                    <p className="vision-result__main-desc">
                      "VisionX can identify objects, describe the surrounding environment, and provide useful spatial information."
                    </p>
                  </div>

                  <div className="vision-result__breakdown">
                    <h3 className="vision-result__breakdown-title">
                      Sample Breakdown Preview
                    </h3>

                    <div className="vision-result__items">
                      <div className="result-item">
                        <div className="result-item__icon-wrap" aria-hidden="true">
                          <span className="material-symbols-outlined">view_in_ar</span>
                        </div>
                        <div className="result-item__text">
                          <strong className="result-item__label">Identified Objects</strong>
                          <span className="result-item__val">Clear pedestrian pathway, doorway (2.4m ahead)</span>
                        </div>
                      </div>

                      <div className="result-item">
                        <div className="result-item__icon-wrap" aria-hidden="true">
                          <span className="material-symbols-outlined">spatial_audio</span>
                        </div>
                        <div className="result-item__text">
                          <strong className="result-item__label">Spatial Context</strong>
                          <span className="result-item__val">Level ground, no immediate floor hazards detected</span>
                        </div>
                      </div>

                      <div className="result-item">
                        <div className="result-item__icon-wrap" aria-hidden="true">
                          <span className="material-symbols-outlined">translate</span>
                        </div>
                        <div className="result-item__text">
                          <strong className="result-item__label">Text in Environment</strong>
                          <span className="result-item__val">"Building Entrance — Push to Open"</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vision-result__disclaimer">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      help_outline
                    </span>
                    <span>
                      This sample showcases the structure and clarity of real-time insights delivered once connected to the vision AI engine.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="vision-result__empty" role="status">
                  <span className="material-symbols-outlined vision-result__empty-icon" aria-hidden="true">
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
