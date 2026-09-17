/**
 * VisionX — AI Accessibility Assistant
 * Landing Page, Assistance Mode Selector & Vision Assist Router
 */

import { useState, useEffect } from 'react'
import './App.css'
import heroImg from './assets/hero.png'
import VisionAssistPage from './pages/VisionAssistPage.jsx'
import HearingAssistPage from './pages/HearingAssistPage.jsx'
import HandsFreeAssistPage from './pages/HandsFreeAssistPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

/* ============================================================
   Logo — inline SVG wordmark (stable, no external URL)
   ============================================================ */
function VisionXLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Eye / lens shape */}
      <ellipse cx="16" cy="16" rx="14" ry="10" stroke="var(--primary-container)" strokeWidth="2.5" fill="none" />
      <circle cx="16" cy="16" r="5" fill="var(--primary-container)" />
      <circle cx="18" cy="14" r="1.5" fill="var(--surface-container-lowest)" />
    </svg>
  )
}

/* ============================================================
   Skip Link
   ============================================================ */
function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  )
}

/* ============================================================
   Theme Toggle
   ============================================================ */
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="material-symbols-outlined theme-toggle__icon" aria-hidden="true">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}

/* ============================================================
   Header / Navigation
   ============================================================ */
function Header({ theme, onToggle, currentView, onNavigate }) {
  const isLanding = currentView === 'landing'
  const isChooseAssist = currentView === 'choose-assist'
  const isVisionAssist = currentView === 'vision-assist'
  const isHearingAssist = currentView === 'hearing-assist'
  const isHandsFree = currentView === 'handsfree-assist'
  const isSettings = currentView === 'settings'

  const handleBack = () => {
    if (isVisionAssist || isHearingAssist || isHandsFree || isSettings) {
      onNavigate('choose-assist')
    } else if (isChooseAssist) {
      onNavigate('landing')
    }
  }

  return (
    <header className="header" role="banner">
      <div className="container header__inner">
        {/* Brand */}
        <a
          className="header__brand"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('landing')
          }}
          aria-label="VisionX — home"
        >
          <VisionXLogo />
          <span className="header__logo-text">VisionX</span>
        </a>

        {/* Desktop Nav on Landing / Tag on other pages */}
        {isLanding ? (
          <nav className="header__nav" aria-label="Main navigation">
            <a className="header__nav-link header__nav-link--active" href="#how-it-works" aria-current="page">
              How it works
            </a>
            <a className="header__nav-link" href="#accessibility">
              Accessibility
            </a>
            <a className="header__nav-link" href="#about">
              About
            </a>
          </nav>
        ) : (
          <div className="header__nav" aria-label="Current page">
            <span className="tag" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
              {isVisionAssist
                ? 'Vision Assist'
                : isHearingAssist
                ? 'Hearing Assist'
                : isHandsFree
                ? 'Hands-Free Assist'
                : isSettings
                ? 'Accessibility Settings'
                : 'Assistance Mode Selection'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="header__actions">
          {!isLanding ? (
            <>
              <button
                type="button"
                className={`btn btn--secondary header__a11y-btn ${isSettings ? 'header__a11y-btn--active' : ''}`}
                onClick={() => onNavigate('settings')}
                aria-label="Open Accessibility Settings"
                aria-current={isSettings ? 'page' : undefined}
              >
                <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                <span>Accessibility</span>
              </button>
              <button
                type="button"
                className="btn btn--secondary header__back-btn"
                onClick={handleBack}
                aria-label={
                  isVisionAssist || isHearingAssist || isHandsFree || isSettings
                    ? 'Back to Choose Your Assist'
                    : 'Back to Home'
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                <span>Back</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => onNavigate('choose-assist')}
              id="header-get-started"
            >
              Get Started
            </button>
          )}

          <ThemeToggle theme={theme} onToggle={onToggle} />

          <div className="header__avatar" aria-hidden="true">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ============================================================
   Hero Section
   ============================================================ */
function HeroSection({ onGetStarted }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__ambient" aria-hidden="true" />
      <div className="container hero__inner">
        {/* Content */}
        <div className="hero__content">
          <div className="status-badge" role="status" aria-live="polite">
            <span className="status-badge__dot" aria-hidden="true" />
            <span className="status-badge__label">AI Accessibility Assistant</span>
            <span className="status-badge__sep" aria-hidden="true">•</span>
            <span className="status-badge__tagline">"Your world, understood."</span>
          </div>

          <h1 className="hero__title" id="hero-title">
            Understand the world around you.
          </h1>

          <p className="hero__body">
            VisionX uses AI to make your surroundings more accessible through
            vision, sound, and simple interaction.
            <br /> Because we care
          </p>

          <div className="hero__ctas">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onGetStarted}
              id="get-started"
            >
              Get Started
            </button>
            <a className="btn btn--secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>

        {/* Visual */}
        <div className="hero__visual">
          <div className="hero__image-wrap">
            <img
              src={heroImg}
              alt="People sharing an accessible and supportive moment outdoors"
              className="hero__image"
              loading="eager"
              width="800"
              height="500"
            />
            <div className="hero__image-badge" aria-hidden="true">
              <span className="hero__image-badge__dot" />
              <span className="hero__image-badge__text">AI-powered accessibility - for better you</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Capabilities Section
   ============================================================ */
const CAPABILITIES = [
  {
    id: 'vision',
    icon: 'visibility',
    title: 'Vision Assist',
    desc: 'Understand objects, surroundings, and spatial information with AI-powered vision.',
    tags: ['Object recognition', 'Spatial depth', 'Text in environment'],
    link: 'Explore Vision Assist',
  },
  {
    id: 'hearing',
    icon: 'hearing',
    title: 'Hearing Assist',
    desc: 'Receive important environmental information through clear visual alerts.',
    tags: ['Environmental sounds', 'Directional cues', 'Visual haptics'],
    link: 'Explore Hearing Assist',
  },
  {
    id: 'handsfree',
    icon: 'graphic_eq',
    title: 'Hands-Free Assist',
    desc: 'Interact with VisionX using simple voice-based controls and accessible interactions.',
    tags: ['Natural speech', 'Hands-free prompts', 'Custom shortcuts'],
    link: 'Explore Hands-Free Assist',
  },
]

function CapabilityCard({ icon, title, desc, tags, link, onExplore }) {
  return (
    <article className="cap-card">
      <div>
        <div className="cap-card__icon-wrap" aria-hidden="true">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="cap-card__body">
          <h3 className="cap-card__title">{title}</h3>
          <p className="cap-card__desc">{desc}</p>
          <div className="cap-card__tags" aria-label="Features">
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="cap-card__link btn--text"
        onClick={onExplore}
      >
        <span>{link}</span>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </button>
    </article>
  )
}

function CapabilitiesSection({ onSelectMode }) {
  return (
    <section className="capabilities" aria-labelledby="capabilities-title">
      <div className="container">
        <div className="capabilities__header">
          <span className="section-label">Multimodal Assistance</span>
          <h2 className="section-title" id="capabilities-title">
            Accessibility, reimagined.
          </h2>
          <p className="section-body">
            VisionX brings multiple accessibility capabilities together in one unified,
            human-centered experience.
          </p>
        </div>
        <div className="capabilities__grid">
          {CAPABILITIES.map((cap) => (
            <CapabilityCard
              key={cap.id}
              {...cap}
              onExplore={() => onSelectMode(cap.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   How It Works Section
   ============================================================ */
const STEPS = [
  {
    id: 'sense',
    num: '01 / SENSE',
    icon: 'sensors',
    title: 'Sense',
    summary: 'VisionX understands information from the user\'s environment.',
    detail: 'Captures ambient visual fields and environmental audio feeds non-intrusively via standard sensors.',
    telemetryLabel: 'Capture Buffer',
    telemetryValue: 'Active 1080p',
    telemetryVariant: 'active',
  },
  {
    id: 'understand',
    num: '02 / UNDERSTAND',
    icon: 'psychology',
    title: 'Understand',
    summary: 'AI processes the information and identifies what matters.',
    detail: 'Distills noise into actionable spatial awareness and prioritizes urgent hazards or pathway choices.',
    telemetryLabel: 'Inference Engine',
    telemetryValue: 'Spatial Graph Ready',
    telemetryVariant: 'primary',
  },
  {
    id: 'assist',
    num: '03 / ASSIST',
    icon: 'support_agent',
    title: 'Assist',
    summary: 'VisionX presents useful information in an accessible way.',
    detail: 'Delivers visual prompts, clear natural descriptions, or haptic directional cues based on personal choice.',
    telemetryLabel: 'Output Modality',
    telemetryValue: 'Speech • Haptics',
    telemetryVariant: 'surface',
  },
]

function StepCard({ num, icon, title, summary, detail, telemetryLabel, telemetryValue, telemetryVariant }) {
  return (
    <div className="step-card">
      <div className="step-card__body">
        <div className="step-card__top">
          <span className="step-card__num" aria-label={`Step ${num}`}>{num}</span>
          <span className="step-card__icon" aria-hidden="true">
            <span className="material-symbols-outlined">{icon}</span>
          </span>
        </div>
        <h3 className="step-card__title">{title}</h3>
        <p className="step-card__summary">{summary}</p>
        <p className="step-card__detail">{detail}</p>
      </div>
      <div className="step-card__telemetry" aria-hidden="true">
        <span className="step-card__telemetry-label">{telemetryLabel}</span>
        <span className={`step-card__telemetry-value step-card__telemetry-value--${telemetryVariant}`}>
          {telemetryValue}
        </span>
      </div>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="how-it-works" id="how-it-works" aria-labelledby="hiw-title">
      <div className="container">
        <div className="how-it-works__header">
          <span className="section-label">Continuous Loop</span>
          <h2 className="section-title" id="hiw-title">
            How VisionX works
          </h2>
          <p className="section-body">
            A seamless three-step loop designed to preserve independence and deliver instant spatial context.
          </p>
        </div>
        <div className="how-it-works__grid">
          {STEPS.map((step) => (
            <StepCard key={step.id} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Accessibility Principles Section
   ============================================================ */
const PRINCIPLES = [
  {
    id: 'interaction',
    icon: 'center_focus_strong',
    title: '1. Clear interaction',
    desc: 'Direct, predictable UI with zero sensory clutter. Everything follows standard mental models without cognitive overhead.',
    wide: false,
  },
  {
    id: 'voice',
    icon: 'keyboard_voice',
    title: '2. Voice-friendly',
    desc: 'Full conversational parity for every capability and configuration. Never locked behind complex touch gestures.',
    wide: false,
  },
  {
    id: 'readability',
    icon: 'match_word',
    title: '3. High readability',
    desc: 'Designed using Atkinson Hyperlegible type and certified WCAG AAA contrast ratios across all daylight settings.',
    wide: false,
  },
  {
    id: 'controls',
    icon: 'touch_app',
    title: '4. Simple controls',
    desc: 'Generous interactive touch footprints (>48px) and logical, deterministic keyboard and screen reader tab stops.',
    wide: false,
  },
  {
    id: 'feedback',
    icon: 'feedback',
    title: '5. Accessible multi-modal feedback',
    desc: 'Every critical state change delivers redundant sensory indicators: text descriptions, clean auditory alerts, and rhythmic haptic feedback. Status is never conveyed through color alone.',
    wide: true,
  },
]

function PrincipleCard({ icon, title, desc, wide }) {
  return (
    <div className={`principle-card${wide ? ' principle-card--wide' : ''}`}>
      <div className="principle-card__icon-wrap" aria-hidden="true">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="principle-card__title">{title}</h3>
      <p className="principle-card__desc">{desc}</p>
    </div>
  )
}

function PrinciplesSection() {
  return (
    <section className="principles" id="accessibility" aria-labelledby="principles-title">
      <div className="container">
        <div className="principles__header">
          <span className="section-label">Core Tenets</span>
          <h2 className="section-title" id="principles-title">
            Designed for independence.
          </h2>
          <p className="section-body">
            Accessibility isn't an extra feature in VisionX. It's built into the experience from the beginning.
          </p>
        </div>
        <div className="principles__grid">
          {PRINCIPLES.map((p) => (
            <PrincipleCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   CTA Section
   ============================================================ */
function CTASection({ onGetStarted }) {
  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-card">
          <div className="cta-card__glow" aria-hidden="true" />
          <div className="cta-card__content">
            <h2 className="cta-card__title" id="cta-title">
              Experience a more accessible world.
            </h2>
            <p className="cta-card__body">
              Start with VisionX and explore your surroundings with greater awareness and sovereign confidence.
            </p>
          </div>
          <div className="cta-card__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onGetStarted}
            >
              Get Started
            </button>
            <a className="cta-card__link" href="#">
              Learn about compatibility &amp; pilot access
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Choose Assistance Mode Page
   ============================================================ */
const ASSIST_MODES = [
  {
    id: 'vision',
    icon: 'visibility',
    title: 'Vision Assist',
    desc: 'Understand objects, surroundings, and spatial information with AI-powered vision.',
    action: 'Start Vision Assist',
    tags: ['Object recognition', 'Spatial depth', 'Text & hazards'],
  },
  {
    id: 'hearing',
    icon: 'hearing',
    title: 'Hearing Assist',
    desc: 'Receive important environmental information through clear visual alerts.',
    action: 'Start Hearing Assist',
    tags: ['Sound detection', 'Visual haptics', 'Directional cues'],
  },
  {
    id: 'handsfree',
    icon: 'mic',
    title: 'Hands-Free Assist',
    desc: 'Interact with VisionX using simple voice-based controls and accessible interactions.',
    action: 'Start Hands-Free Assist',
    tags: ['Voice control', 'Hands-free prompts', 'Smart shortcuts'],
  },
]

function AssistanceCard({
  id,
  icon,
  title,
  desc,
  action,
  tags,
  isSelected,
  onSelect,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`assist-card ${isSelected ? 'assist-card--selected' : ''}`}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(id)
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${title}: ${desc}. Action: ${action}`}
    >
      <div>
        <div className="assist-card__top">
          <div className="assist-card__icon-wrap" aria-hidden="true">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div className="assist-card__badge-wrap">
            <div
              className="assist-card__select-indicator"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined">check</span>
            </div>
          </div>
        </div>

        <div className="assist-card__body">
          <h2 className="assist-card__title">{title}</h2>
          <p className="assist-card__desc">{desc}</p>
          <div className="assist-card__tags" aria-label={`${title} features`}>
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="assist-card__footer">
        <button
          type="button"
          tabIndex={-1}
          className={`btn ${isSelected ? 'btn--primary' : 'btn--secondary'} assist-card__action`}
          aria-hidden="true"
        >
          <span>{action}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

function ChooseAssistPage({ selectedMode, onSelectMode, onStartAssist }) {
  const handleCardClick = (modeId) => {
    onSelectMode(modeId)
    if (onStartAssist) {
      onStartAssist(modeId)
    }
  }

  // Quick-Launch Keyboard Shortcuts (1 -> Vision, 2 -> Hearing, 3 -> Hands-Free)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside an input, textarea, contenteditable, or select element
      const activeElement = document.activeElement
      const activeTag = activeElement ? activeElement.tagName.toLowerCase() : ''
      const isEditable = activeElement ? activeElement.isContentEditable : false
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        isEditable
      ) {
        return
      }

      // Do not interfere with browser modifier shortcuts (Ctrl, Meta, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      if (e.key === '1') {
        e.preventDefault()
        handleCardClick('vision')
      } else if (e.key === '2') {
        e.preventDefault()
        handleCardClick('hearing')
      } else if (e.key === '3') {
        e.preventDefault()
        handleCardClick('handsfree')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSelectMode, onStartAssist])

  return (
    <main className="main choose-assist" id="main-content">
      <div className="choose-assist__ambient" aria-hidden="true" />
      <div className="container choose-assist__inner">
        <div className="choose-assist__header">
          <div className="choose-assist__badge" role="status">
            <span className="choose-assist__badge-dot" aria-hidden="true" />
            <span>Choose Your Assist</span>
          </div>
          <h1 className="choose-assist__title">
            How can VisionX assist you?
          </h1>
          <p className="choose-assist__subtitle">
            Choose an assistance mode to get started.
          </p>
        </div>

        <div className="choose-assist__grid" role="region" aria-label="Assistance Modes Selection">
          {ASSIST_MODES.map((mode) => (
            <AssistanceCard
              key={mode.id}
              {...mode}
              isSelected={selectedMode === mode.id}
              onSelect={handleCardClick}
            />
          ))}
        </div>

        {/* Quick-Launch Keyboard Hint */}
        <div
          className="choose-assist__keyboard-hint"
          role="note"
          aria-label="For Keyboard: Press 1, 2, or 3 to launch immediately."
        >
          <span className="material-symbols-outlined choose-assist__hint-icon" aria-hidden="true">
            keyboard
          </span>
          <span>
            For quick assisstance with keyboard: Press <kbd className="hint-kbd">1</kbd>, <kbd className="hint-kbd">2</kbd>, or <kbd className="hint-kbd">3</kbd> to launch immediately.
          </span>
        </div>
      </div>
    </main>
  )
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="footer__brand-name">VisionX</span>
            <p className="footer__tagline">Your world, understood.</p>
          </div>
          <nav className="footer__nav" aria-label="Footer navigation">
            <a className="footer__nav-link" href="#how-it-works">How it works</a>
            <a className="footer__nav-link" href="#accessibility">Accessibility</a>
            <a className="footer__nav-link" href="#about">About</a>
          </nav>
        </div>
        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 VisionX. Designed for independence.</p>
          <div className="footer__wcag-badge" aria-label="WCAG 2.1 AA Aligned">
            <span className="footer__wcag-dot" aria-hidden="true" />
            <span>WCAG 2.1 AA Aligned</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   App Root
   ============================================================ */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('visionx_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      // localStorage may fail in strict private modes
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // View state: 'landing' | 'choose-assist' | 'vision-assist' | 'hearing-assist' | 'handsfree-assist' | 'settings'
  const [currentView, setCurrentView] = useState(() => {
    if (window.location.hash === '#vision-assist')    return 'vision-assist'
    if (window.location.hash === '#hearing-assist')   return 'hearing-assist'
    if (window.location.hash === '#handsfree-assist') return 'handsfree-assist'
    if (window.location.hash === '#choose-assist')    return 'choose-assist'
    if (window.location.hash === '#settings')         return 'settings'
    return 'landing'
  })

  // Selected mode state
  const [selectedMode, setSelectedMode] = useState('vision')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('visionx_theme', theme)
    } catch {
      // ignore storage errors
    }
  }, [theme])

  // Sync with system preference if user hasn't explicitly saved a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const hasExplicitChoice = localStorage.getItem('visionx_theme')
      if (!hasExplicitChoice) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Sync URL hash with view state
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#vision-assist') {
        setCurrentView('vision-assist')
      } else if (window.location.hash === '#hearing-assist') {
        setCurrentView('hearing-assist')
      } else if (window.location.hash === '#handsfree-assist') {
        setCurrentView('handsfree-assist')
      } else if (window.location.hash === '#choose-assist') {
        setCurrentView('choose-assist')
      } else if (window.location.hash === '#settings') {
        setCurrentView('settings')
      } else if (window.location.hash === '' || window.location.hash === '#') {
        setCurrentView('landing')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (view, mode = null) => {
    setCurrentView(view)
    if (mode) setSelectedMode(mode)
    if (view === 'vision-assist') {
      window.location.hash = 'vision-assist'
    } else if (view === 'hearing-assist') {
      window.location.hash = 'hearing-assist'
    } else if (view === 'handsfree-assist') {
      window.location.hash = 'handsfree-assist'
    } else if (view === 'choose-assist') {
      window.location.hash = 'choose-assist'
    } else if (view === 'settings') {
      window.location.hash = 'settings'
    } else {
      if (window.location.hash) {
        history.pushState(null, '', window.location.pathname)
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <>
      <SkipLink />
      <Header
        theme={theme}
        onToggle={toggleTheme}
        currentView={currentView}
        onNavigate={navigateTo}
      />
      {currentView === 'landing' && (
        <main className="main" id="main-content">
          <HeroSection onGetStarted={() => navigateTo('choose-assist')} />
          <CapabilitiesSection onSelectMode={(mode) => navigateTo('choose-assist', mode)} />
          <HowItWorksSection />
          <PrinciplesSection />
          <CTASection onGetStarted={() => navigateTo('choose-assist')} />
        </main>
      )}
      {currentView === 'choose-assist' && (
        <ChooseAssistPage
          selectedMode={selectedMode}
          onSelectMode={(mode) => setSelectedMode(mode)}
          onStartAssist={(mode) => {
            if (mode === 'vision')     navigateTo('vision-assist')
            if (mode === 'hearing')    navigateTo('hearing-assist')
            if (mode === 'handsfree') navigateTo('handsfree-assist')
          }}
        />
      )}
      {currentView === 'vision-assist' && (
        <VisionAssistPage
          onBack={() => navigateTo('choose-assist')}
        />
      )}
      {currentView === 'hearing-assist' && (
        <HearingAssistPage
          onBack={() => navigateTo('choose-assist')}
        />
      )}
      {currentView === 'handsfree-assist' && (
        <HandsFreeAssistPage
          onBack={() => navigateTo('choose-assist')}
        />
      )}
      {currentView === 'settings' && (
        <SettingsPage
          onBack={() => navigateTo('choose-assist')}
          onNavigate={navigateTo}
        />
      )}
      <Footer />
    </>
  )
}
