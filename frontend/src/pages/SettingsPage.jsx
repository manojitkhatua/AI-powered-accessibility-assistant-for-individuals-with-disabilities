/**
 * VisionX — Accessibility Settings Page
 * Centralized accessibility management for visual, audio, interaction, and regional settings.
 * 
 * FRONTEND ONLY: State is maintained in React component state, structured for future browser persistence.
 */

import { useState, useEffect } from 'react'
import './SettingsPage.css'

// Default factory configuration
export const DEFAULT_SETTINGS = {
  textSize: 'normal',             // 'normal' | 'large' | 'extra-large'
  highContrast: false,
  reducedMotion: false,
  voiceResponses: true,
  readResponsesAloud: false,
  voiceFeedback: true,
  largeControls: false,
  keyboardNavigation: true,
  simplifiedInteraction: false,
  language: 'en',
}

export default function SettingsPage({ onBack, onNavigate }) {
  // FUTURE FRONTEND ENHANCEMENT: Persist via localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('visionx_accessibility_settings')
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch {
      // ignore storage parsing error
    }
    return DEFAULT_SETTINGS
  })

  const [notification, setNotification] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSignOutNotice, setShowSignOutNotice] = useState(false)

  // Save changes locally and announce to screen reader
  const updateSetting = (key, value, announcementText) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem('visionx_accessibility_settings', JSON.stringify(next))
      } catch {
        // ignore storage error
      }
      return next
    })

    if (announcementText) {
      setNotification({
        id: Date.now(),
        text: announcementText,
        type: 'info',
      })
    }
  }

  // Clear toast after 4 seconds
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      setNotification(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [notification])

  // Handle resetting settings back to defaults
  const handleConfirmReset = () => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.setItem('visionx_accessibility_settings', JSON.stringify(DEFAULT_SETTINGS))
    } catch {
      // ignore storage error
    }
    setShowResetModal(false)
    setNotification({
      id: Date.now(),
      text: 'All accessibility settings have been reset to factory defaults.',
      type: 'success',
    })
  }

  // Handle simulated sign out
  const handleSignOut = () => {
    // BACKEND REQUIRED: Connect Sign Out to the application's authentication/session system.
    setShowSignOutNotice(true)
  }

  // Language options
  const languageOptions = [
    { code: 'en', label: 'English (United States)' },
    { code: 'es', label: 'Spanish (Español)' },
    { code: 'fr', label: 'French (Français)' },
    { code: 'de', label: 'German (Deutsch)' },
    { code: 'hi', label: 'Hindi (हिन्दी)' },
    { code: 'ja', label: 'Japanese (日本語)' },
    { code: 'zh', label: 'Mandarin Chinese (中文)' },
    { code: 'pt', label: 'Portuguese (Português)' },
    { code: 'ar', label: 'Arabic (العربية)' },
  ]

  // Count active custom preferences
  const activeCustomizations = [
    settings.textSize !== 'normal',
    settings.highContrast,
    settings.reducedMotion,
    !settings.voiceResponses, // changed from default true
    settings.readResponsesAloud,
    !settings.voiceFeedback,  // changed from default true
    settings.largeControls,
    !settings.keyboardNavigation,
    settings.simplifiedInteraction,
    settings.language !== 'en',
  ].filter(Boolean).length

  return (
    <div className="settings-page" id="main-content">
      <div className="settings-page__container">
        {/* Navigation Breadcrumb */}
        <nav className="settings-nav" aria-label="Breadcrumb">
          <button
            type="button"
            className="settings-nav__back"
            onClick={onBack}
            aria-label="Back to Choose Your Assist"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>Back to Choose Your Assist</span>
          </button>
        </nav>

        {/* Page Hero */}
        <header className="settings-hero">
          <div className="settings-hero__badge">
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            <span>Personalized Experience</span>
          </div>
          <h1 className="settings-hero__title">Accessibility Settings</h1>
          <p className="settings-hero__desc">
            Customize VisionX to make your experience clearer, easier, and more comfortable to use across all assistance modes.
          </p>
        </header>

        {/* Dynamic Toast / Status Banner */}
        {notification && (
          <div
            className={`settings-toast ${notification.type === 'success' ? 'settings-toast--success' : ''}`}
            role="status"
            aria-live="polite"
          >
            <span className="material-symbols-outlined settings-toast__icon" aria-hidden="true">
              {notification.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="settings-toast__text">{notification.text}</span>
          </div>
        )}

        {/* Screen Reader Live Announcements */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {notification?.text || ''}
        </div>

        {/* Quick Profile Summary */}
        <div className="settings-summary-card" aria-label="Current accessibility preferences summary">
          <div className="settings-summary-card__header">
            <h2 className="settings-summary-card__title">
              <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
              Active Profile Status
            </h2>
            <span className="tag" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
              {activeCustomizations === 0 ? 'Default Settings' : `${activeCustomizations} Custom Setting${activeCustomizations > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="settings-summary-card__pills">
            <span className={`settings-summary-pill ${settings.textSize !== 'normal' ? 'settings-summary-pill--active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>format_size</span>
              Text: {settings.textSize.charAt(0).toUpperCase() + settings.textSize.slice(1)}
            </span>
            <span className={`settings-summary-pill ${settings.highContrast ? 'settings-summary-pill--active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>contrast</span>
              High Contrast: {settings.highContrast ? 'On' : 'Off'}
            </span>
            <span className={`settings-summary-pill ${settings.voiceResponses ? 'settings-summary-pill--active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>record_voice_over</span>
              Voice: {settings.voiceResponses ? 'On' : 'Off'}
            </span>
            <span className={`settings-summary-pill ${settings.largeControls ? 'settings-summary-pill--active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>ads_click</span>
              Large Controls: {settings.largeControls ? 'On' : 'Off'}
            </span>
            <span className={`settings-summary-pill ${settings.language !== 'en' ? 'settings-summary-pill--active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>language</span>
              Lang: {languageOptions.find((l) => l.code === settings.language)?.label.split(' ')[0] || 'English'}
            </span>
          </div>
        </div>

        {/* ============================================================
            SECTION 1: VISUAL SETTINGS
            ============================================================ */}
        <section className="settings-section" aria-labelledby="visual-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box">
              <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="visual-settings-heading" className="settings-section__title">Visual Settings</h2>
              <p className="settings-section__subtitle">
                Adjust display scale, contrast ratios, and motion behavior for optimal visual clarity.
              </p>
            </div>
          </div>

          <div className="settings-list">
            {/* Text Size (Radio Group) */}
            <div className="text-size-group" role="radiogroup" aria-labelledby="text-size-label">
              <div id="text-size-label" className="text-size-group__label">Text Size</div>
              <div className="text-size-group__desc">
                Scale font sizes for labels, instructions, and assistance descriptions.
              </div>
              <div className="text-size-options">
                {/* Normal */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.textSize === 'normal'}
                  className={`text-size-card ${settings.textSize === 'normal' ? 'text-size-card--active' : ''}`}
                  onClick={() => updateSetting('textSize', 'normal', 'Text size set to Normal (100%).')}
                >
                  <div className="text-size-card__top">
                    <span className="text-size-card__preview text-size-card__preview--normal">Aa</span>
                    <div className="text-size-card__radio" aria-hidden="true">
                      <div className="text-size-card__radio-dot" />
                    </div>
                  </div>
                  <div className="text-size-card__name">Normal</div>
                  <div className="text-size-card__sub">Standard font size (100%)</div>
                </button>

                {/* Large */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.textSize === 'large'}
                  className={`text-size-card ${settings.textSize === 'large' ? 'text-size-card--active' : ''}`}
                  onClick={() => updateSetting('textSize', 'large', 'Text size set to Large (115%).')}
                >
                  <div className="text-size-card__top">
                    <span className="text-size-card__preview text-size-card__preview--large">Aa</span>
                    <div className="text-size-card__radio" aria-hidden="true">
                      <div className="text-size-card__radio-dot" />
                    </div>
                  </div>
                  <div className="text-size-card__name">Large</div>
                  <div className="text-size-card__sub">Enhanced legibility (115%)</div>
                </button>

                {/* Extra Large */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.textSize === 'extra-large'}
                  className={`text-size-card ${settings.textSize === 'extra-large' ? 'text-size-card--active' : ''}`}
                  onClick={() => updateSetting('textSize', 'extra-large', 'Text size set to Extra Large (130%).')}
                >
                  <div className="text-size-card__top">
                    <span className="text-size-card__preview text-size-card__preview--xlarge">Aa</span>
                    <div className="text-size-card__radio" aria-hidden="true">
                      <div className="text-size-card__radio-dot" />
                    </div>
                  </div>
                  <div className="text-size-card__name">Extra Large</div>
                  <div className="text-size-card__sub">Maximum visibility (130%)</div>
                </button>
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-high-contrast">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">contrast</span>
                  High Contrast Mode
                </div>
                <div className="setting-row__desc">
                  Increase contrast between text, card borders, and backgrounds for easier reading in different lighting conditions.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.highContrast ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.highContrast ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.highContrast}
                  aria-labelledby="label-high-contrast"
                  className={`toggle-switch ${settings.highContrast ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('highContrast', !settings.highContrast, `High Contrast turned ${!settings.highContrast ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-reduced-motion">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">motion_photos_off</span>
                  Reduced Motion
                </div>
                <div className="setting-row__desc">
                  Minimize animations, pulsing effects, and camera transition effects across all pages.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.reducedMotion ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.reducedMotion ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.reducedMotion}
                  aria-labelledby="label-reduced-motion"
                  className={`toggle-switch ${settings.reducedMotion ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('reducedMotion', !settings.reducedMotion, `Reduced Motion turned ${!settings.reducedMotion ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: AUDIO & VOICE SETTINGS
            ============================================================ */}
        <section className="settings-section" aria-labelledby="audio-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box settings-section__icon-box--audio">
              <span className="material-symbols-outlined" aria-hidden="true">volume_up</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="audio-settings-heading" className="settings-section__title">Audio & Voice Settings</h2>
              <p className="settings-section__subtitle">
                Configure spoken responses, automated readouts, and auditory feedback signals.
              </p>
            </div>
          </div>

          <div className="settings-list">
            {/* Voice Responses Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-voice-responses">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">record_voice_over</span>
                  Voice Responses
                </div>
                <div className="setting-row__desc">
                  Enable natural spoken voice answers from VisionX during hands-free and visual assistance.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.voiceResponses ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.voiceResponses ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.voiceResponses}
                  aria-labelledby="label-voice-responses"
                  className={`toggle-switch ${settings.voiceResponses ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('voiceResponses', !settings.voiceResponses, `Voice Responses turned ${!settings.voiceResponses ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Read Responses Aloud Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-read-aloud">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">campaign</span>
                  Read Responses Aloud
                </div>
                <div className="setting-row__desc">
                  Automatically read assistance results, visual descriptions, and sound alerts upon recognition.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.readResponsesAloud ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.readResponsesAloud ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.readResponsesAloud}
                  aria-labelledby="label-read-aloud"
                  className={`toggle-switch ${settings.readResponsesAloud ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('readResponsesAloud', !settings.readResponsesAloud, `Read Responses Aloud turned ${!settings.readResponsesAloud ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Voice Feedback / Chimes Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-voice-feedback">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">notifications_active</span>
                  Auditory Feedback Chimes
                </div>
                <div className="setting-row__desc">
                  Play subtle audio confirmation chimes when voice commands are initiated and completed.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.voiceFeedback ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.voiceFeedback ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.voiceFeedback}
                  aria-labelledby="label-voice-feedback"
                  className={`toggle-switch ${settings.voiceFeedback ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('voiceFeedback', !settings.voiceFeedback, `Auditory Feedback turned ${!settings.voiceFeedback ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: INTERACTION SETTINGS
            ============================================================ */}
        <section className="settings-section" aria-labelledby="interaction-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box settings-section__icon-box--interaction">
              <span className="material-symbols-outlined" aria-hidden="true">touch_app</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="interaction-settings-heading" className="settings-section__title">Interaction & Control</h2>
              <p className="settings-section__subtitle">
                Customize touch target dimensions, keyboard shortcuts, and interface density.
              </p>
            </div>
          </div>

          <div className="settings-list">
            {/* Large Controls Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-large-controls">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">touch_app</span>
                  Large Controls & Touch Targets
                </div>
                <div className="setting-row__desc">
                  Enlarge buttons, toggles, and interactive touch areas for easier activation.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.largeControls ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.largeControls ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.largeControls}
                  aria-labelledby="label-large-controls"
                  className={`toggle-switch ${settings.largeControls ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('largeControls', !settings.largeControls, `Large Controls turned ${!settings.largeControls ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Keyboard Navigation Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-keyboard-nav">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">keyboard</span>
                  Enhanced Keyboard Navigation
                </div>
                <div className="setting-row__desc">
                  Enable high-visibility focus indicators, skip navigation links, and rapid shortcut keys.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.keyboardNavigation ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.keyboardNavigation ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.keyboardNavigation}
                  aria-labelledby="label-keyboard-nav"
                  className={`toggle-switch ${settings.keyboardNavigation ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('keyboardNavigation', !settings.keyboardNavigation, `Enhanced Keyboard Navigation turned ${!settings.keyboardNavigation ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Simplified Interaction Toggle */}
            <div className="setting-row">
              <div className="setting-row__info">
                <div className="setting-row__label" id="label-simplified-interaction">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">widgets</span>
                  Simplified Interaction Mode
                </div>
                <div className="setting-row__desc">
                  Hide non-essential auxiliary panels and focus solely on direct assistive actions.
                </div>
              </div>
              <div className="toggle-switch-wrap">
                <span
                  className={`toggle-badge ${settings.simplifiedInteraction ? 'toggle-badge--active' : ''}`}
                  aria-hidden="true"
                >
                  {settings.simplifiedInteraction ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.simplifiedInteraction}
                  aria-labelledby="label-simplified-interaction"
                  className={`toggle-switch ${settings.simplifiedInteraction ? 'toggle-switch--active' : ''}`}
                  onClick={() => updateSetting('simplifiedInteraction', !settings.simplifiedInteraction, `Simplified Interaction turned ${!settings.simplifiedInteraction ? 'On' : 'Off'}.`)}
                >
                  <span className="toggle-switch__thumb" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: LANGUAGE & REGIONAL
            ============================================================ */}
        <section className="settings-section" aria-labelledby="language-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box settings-section__icon-box--language">
              <span className="material-symbols-outlined" aria-hidden="true">translate</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="language-settings-heading" className="settings-section__title">Language & Regional</h2>
              <p className="settings-section__subtitle">
                Select your preferred language for visual descriptions, voice recognition, and notifications.
              </p>
            </div>
          </div>

          <div className="settings-list">
            <div className="language-select-box">
              <label htmlFor="language-picker" className="setting-row__label">
                Interface & Assistant Language
              </label>
              {/* BACKEND/APP INTEGRATION REQUIRED: Apply selected language across VisionX interface and supported AI responses. */}
              <select
                id="language-picker"
                className="language-select"
                value={settings.language}
                onChange={(e) => {
                  const selected = languageOptions.find((l) => l.code === e.target.value)
                  updateSetting('language', e.target.value, `Language updated to ${selected?.label || 'English'}.`)
                }}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="language-notice">
                Selected language will be applied to all speech synthesis and visual descriptions once backend processing is active.
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: RESET SETTINGS
            ============================================================ */}
        <section className="settings-section" aria-labelledby="reset-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box settings-section__icon-box--danger">
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="reset-settings-heading" className="settings-section__title">Reset Accessibility Settings</h2>
              <p className="settings-section__subtitle">
                Restore all visual, audio, interaction, and language preferences to their original defaults.
              </p>
            </div>
          </div>

          <div className="settings-action-card">
            <div className="settings-action-card__body">
              <div className="settings-action-card__title">Restore Default Preferences</div>
              <div className="settings-action-card__desc">
                This action will reset your personalized settings across all assist tools.
              </div>
            </div>
            <button
              type="button"
              className="btn--danger-outline"
              onClick={() => setShowResetModal(true)}
              aria-label="Open reset accessibility settings confirmation"
            >
              Reset Accessibility Settings
            </button>
          </div>
        </section>

        {/* ============================================================
            SECTION 6: ACCOUNT & SESSION
            ============================================================ */}
        <section className="settings-section" aria-labelledby="session-settings-heading">
          <div className="settings-section__header">
            <div className="settings-section__icon-box">
              <span className="material-symbols-outlined" aria-hidden="true">account_circle</span>
            </div>
            <div className="settings-section__heading-wrap">
              <h2 id="session-settings-heading" className="settings-section__title">Account & Session</h2>
              <p className="settings-section__subtitle">
                Manage your user session and connected accessibility profile.
              </p>
            </div>
          </div>

          <div className="settings-action-card">
            <div className="settings-action-card__body">
              <div className="settings-action-card__title">Sign Out of VisionX</div>
              <div className="settings-action-card__desc">
                Sign out of your active session on this device.
              </div>
            </div>
            {/* BACKEND REQUIRED: Connect Sign Out to the application's authentication/session system. */}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleSignOut}
              aria-label="Sign Out of VisionX"
            >
              <span className="material-symbols-outlined" aria-hidden="true">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </section>
      </div>

      {/* ============================================================
          RESET CONFIRMATION MODAL DIALOG
          ============================================================ */}
      {showResetModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          aria-describedby="reset-modal-desc"
        >
          <div className="modal-card">
            <div className="modal-card__header">
              <span className="material-symbols-outlined modal-card__icon" aria-hidden="true">
                warning
              </span>
              <h3 id="reset-modal-title" className="modal-card__title">
                Reset all accessibility settings?
              </h3>
            </div>
            <p id="reset-modal-desc" className="modal-card__desc">
              Are you sure you want to reset all visual, audio, interaction, and language preferences? This will restore VisionX to default factory settings.
            </p>
            <div className="modal-card__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn--danger-filled"
                onClick={handleConfirmReset}
                autoFocus
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SIGN OUT NOTICE MODAL / DIALOG
          ============================================================ */}
      {showSignOutNotice && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-modal-title"
          aria-describedby="signout-modal-desc"
        >
          <div className="modal-card">
            <div className="modal-card__header">
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }} aria-hidden="true">
                info
              </span>
              <h3 id="signout-modal-title" className="modal-card__title">
                Sign Out Notice
              </h3>
            </div>
            <p id="signout-modal-desc" className="modal-card__desc">
              Sign out functionality is prepared. Backend authentication service integration is required to terminate the active user session.
            </p>
            <div className="modal-card__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setShowSignOutNotice(false)}
                autoFocus
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
