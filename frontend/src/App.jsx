/**
 * VisionX — AI Accessibility Assistant
 * Landing Page Implementation
 * Source: Stitch screen 2b97dab0e7be49088b12cf25740e6da0
 */

import './App.css'
import heroImg from './assets/hero.png'

/* ============================================================
   Logo — inline SVG wordmark (stable, no external URL)
   ============================================================ */
function VisionXLogo() {
  return (
    <svg
      width="96"
      height="32"
      viewBox="0 0 96 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Eye / lens shape */}
      <ellipse cx="16" cy="16" rx="14" ry="10" stroke="#0b5fff" strokeWidth="2.5" fill="none" />
      <circle cx="16" cy="16" r="5" fill="#0b5fff" />
      <circle cx="18" cy="14" r="1.5" fill="#ffffff" />
      {/* "VisionX" wordmark text rendered as path-based approach via inline text */}
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
   Header / Navigation
   ============================================================ */
function Header() {
  return (
    <header className="header" role="banner">
      <div className="container header__inner">
        {/* Brand */}
        <a className="header__brand" href="#" aria-label="VisionX — home">
          <VisionXLogo />
          <span className="header__logo-text">VisionX</span>
        </a>

        {/* Desktop Nav */}
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

        {/* Actions */}
        <div className="header__actions">
          <a className="btn btn--primary btn--sm" href="#get-started">
            Get Started
          </a>
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
function HeroSection() {
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
          </p>

          <div className="hero__ctas">
            <a className="btn btn--primary" href="#get-started" id="get-started">
              Get Started
            </a>
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
              <span className="hero__image-badge__text">AI-powered accessibility</span>
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

function CapabilityCard({ icon, title, desc, tags, link }) {
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
      <a className="cap-card__link" href="#">
        <span>{link}</span>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </a>
    </article>
  )
}

function CapabilitiesSection() {
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
            <CapabilityCard key={cap.id} {...cap} />
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
function CTASection() {
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
            <a className="btn btn--primary" href="#get-started">
              Get Started
            </a>
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
          <p className="footer__copyright">© 2025 VisionX. Designed for independence.</p>
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
  return (
    <>
      <SkipLink />
      <Header />
      <main className="main" id="main-content">
        <HeroSection />
        <CapabilitiesSection />
        <HowItWorksSection />
        <PrinciplesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
