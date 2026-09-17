/**
 * VisionX — Sign Up Page
 * Accessible account creation interface
 * 
 * FRONTEND ONLY:
 * Form validation and submission simulation.
 * Real authentication, database integration, and sessions are to be connected in future backend milestones.
 */

import { useState } from 'react'
import './SignUpPage.css'

export default function SignUpPage({ onBack, onNavigate }) {
  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Visibility toggles for password fields
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation error state
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Submission ready state (frontend simulation)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Email regex validator
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  // Validate form fields
  const validateField = (field, value, allData = formData) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full Name is required.'
        if (value.trim().length < 2) return 'Full Name must be at least 2 characters.'
        return ''

      case 'email':
        if (!value.trim()) return 'Email Address is required.'
        if (!isValidEmail(value)) return 'Please enter a valid email address (e.g. name@example.com).'
        return ''

      case 'password':
        if (!value) return 'Password is required.'
        if (value.length < 8) return 'Password must be at least 8 characters.'
        return ''

      case 'confirmPassword':
        if (!value) return 'Please confirm your password.'
        if (value !== allData.password) return 'Passwords do not match.'
        return ''

      default:
        return ''
    }
  }

  // Validate full form
  const validateForm = () => {
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    }

    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, val]) => Boolean(val))
    )

    setErrors(filteredErrors)
    return Object.keys(filteredErrors).length === 0
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)

    // Re-validate field if already touched
    if (touched[name]) {
      const fieldError = validateField(name, value, updated)
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }))
    }

    // Re-validate confirmPassword when password changes
    if (name === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, updated)
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmErr,
      }))
    }
  }

  // Handle blur for individual field validation
  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const fieldError = validateField(name, value)
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }))
  }

  // Handle submission
  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    const isValid = validateForm()
    if (!isValid) {
      // Focus first error field for keyboard accessibility
      const firstErrorKey = Object.keys(errors)[0]
      if (firstErrorKey) {
        document.getElementById(`signup-${firstErrorKey}`)?.focus()
      }
      return
    }

    // ============================================================
    // BACKEND INTEGRATION HOOKS
    // ============================================================
    // BACKEND REQUIRED: Connect this form to the authentication/signup API.
    // BACKEND REQUIRED: Create the user account and securely handle authentication.
    // BACKEND REQUIRED: Handle duplicate email and authentication errors.
    // BACKEND REQUIRED: Redirect authenticated users after successful account creation.

    // Frontend simulation state
    setIsSubmitted(true)
  }

  // Reset form
  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setErrors({})
    setTouched({})
    setIsSubmitted(false)
  }

  return (
    <main className="signup-page" id="main-content">
      <div className="signup-container">
        {/* Top Back Navigation */}
        <nav className="signup-nav" aria-label="Breadcrumb">
          <button
            type="button"
            className="signup-nav__back"
            onClick={onBack}
            aria-label="Back to previous page"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>Back</span>
          </button>
        </nav>

        {/* Main Sign Up Card */}
        <div className="signup-card">
          {/* VisionX Branding Header */}
          <div className="signup-brand">
            <div className="signup-brand__logo">
              {/* VisionX Lens/Eye SVG Icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <ellipse cx="16" cy="16" rx="14" ry="10" stroke="var(--primary-container)" strokeWidth="2.5" fill="none" />
                <circle cx="16" cy="16" r="5" fill="var(--primary-container)" />
                <circle cx="18" cy="14" r="1.5" fill="var(--surface-container-lowest)" />
              </svg>
              <span className="signup-brand__name">VisionX</span>
            </div>
            <span className="signup-brand__tagline">Your world, understood.</span>
          </div>

          {!isSubmitted ? (
            <>
              {/* Card Header */}
              <div className="signup-header">
                <h1 className="signup-title">Create your VisionX account</h1>
                <p className="signup-subtitle">
                  Set up your account to access your personalized accessibility experience.
                </p>
              </div>

              {/* Accessible Form */}
              <form className="signup-form" onSubmit={handleSubmit} noValidate>
                {/* 1. Full Name */}
                <div className="form-group">
                  <label htmlFor="signup-name" className="form-label">
                    <span>
                      Full Name <span className="form-label__required" aria-hidden="true">*</span>
                    </span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      className={`form-input ${errors.name && touched.name ? 'form-input--error' : ''}`}
                      placeholder="e.g. Manojit Kathua"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.name && touched.name)}
                      aria-describedby={errors.name && touched.name ? 'signup-name-error' : undefined}
                    />
                  </div>
                  {errors.name && touched.name && (
                    <div id="signup-name-error" className="form-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">error</span>
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                {/* 2. Email Address */}
                <div className="form-group">
                  <label htmlFor="signup-email" className="form-label">
                    <span>
                      Email Address <span className="form-label__required" aria-hidden="true">*</span>
                    </span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      className={`form-input ${errors.email && touched.email ? 'form-input--error' : ''}`}
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.email && touched.email)}
                      aria-describedby={errors.email && touched.email ? 'signup-email-error' : undefined}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <div id="signup-email-error" className="form-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">error</span>
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* 3. Password */}
                <div className="form-group">
                  <label htmlFor="signup-password" className="form-label">
                    <span>
                      Password <span className="form-label__required" aria-hidden="true">*</span>
                    </span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input form-input--password ${errors.password && touched.password ? 'form-input--error' : ''}`}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.password && touched.password)}
                      aria-describedby={errors.password && touched.password ? 'signup-password-error' : 'signup-password-hint'}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.password && touched.password ? (
                    <div id="signup-password-error" className="form-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">error</span>
                      <span>{errors.password}</span>
                    </div>
                  ) : (
                    <div id="signup-password-hint" className="form-hint">
                      Must contain at least 8 characters.
                    </div>
                  )}
                </div>

                {/* 4. Confirm Password */}
                <div className="form-group">
                  <label htmlFor="signup-confirm-password" className="form-label">
                    <span>
                      Confirm Password <span className="form-label__required" aria-hidden="true">*</span>
                    </span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input form-input--password ${errors.confirmPassword && touched.confirmPassword ? 'form-input--error' : ''}`}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.confirmPassword && touched.confirmPassword)}
                      aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'signup-confirm-error' : undefined}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div id="signup-confirm-error" className="form-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">error</span>
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                {/* Primary Button */}
                <button type="submit" className="btn btn--primary signup-submit-btn">
                  Create Account
                </button>
              </form>

              {/* Secondary Navigation */}
              <div className="signup-footer-nav">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="signup-signin-link"
                  onClick={() => setShowSignInModal(true)}
                  aria-label="Already have an account? Sign in"
                >
                  Sign in
                </button>
              </div>

              {/* Accessibility Note */}
              <div className="signup-a11y-note" role="note" aria-label="Accessibility commitment">
                <span className="material-symbols-outlined signup-a11y-note__icon" aria-hidden="true">
                  accessibility_new
                </span>
                <p className="signup-a11y-note__text">
                  VisionX is designed with accessible interaction, readable interfaces, and flexible accessibility settings in mind.
                </p>
              </div>
            </>
          ) : (
            /* ============================================================
               FRONTEND SUCCESS / READY STATE (NO MOCK ACCOUNT CLAIM)
               ============================================================ */
            <div className="signup-success-card" role="status" aria-live="polite">
              <div className="signup-success-card__icon-box">
                <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
              </div>
              <h2 className="signup-success-card__title">Account details ready</h2>
              <p className="signup-success-card__desc">
                Your sign-up information has been validated. Authentication will be connected by the backend service.
              </p>

              <div className="signup-summary-box">
                <div className="signup-summary-box__row">
                  <span className="signup-summary-box__label">Name:</span>
                  <span className="signup-summary-box__value">{formData.name}</span>
                </div>
                <div className="signup-summary-box__row">
                  <span className="signup-summary-box__label">Email:</span>
                  <span className="signup-summary-box__value">{formData.email}</span>
                </div>
                <div className="signup-summary-box__row">
                  <span className="signup-summary-box__label">Status:</span>
                  <span className="signup-summary-box__value" style={{ color: 'var(--tertiary)' }}>
                    Frontend Validated
                  </span>
                </div>
              </div>

              <div className="signup-success-card__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onNavigate('choose-assist')}
                >
                  Explore Assist Features
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleResetForm}
                >
                  Create Another Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          SIGN IN MODAL NOTICE (PLACEHOLDER)
          ============================================================ */}
      {showSignInModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
          aria-describedby="signin-modal-desc"
        >
          <div className="modal-card">
            <div className="modal-card__header">
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }} aria-hidden="true">
                info
              </span>
              <h3 id="signin-modal-title" className="modal-card__title">
                Sign In Notice
              </h3>
            </div>
            <p id="signin-modal-desc" className="modal-card__desc">
              Sign In authentication is currently in preparation. Backend session and login authentication APIs will connect here in a future update.
            </p>
            <div className="modal-card__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setShowSignInModal(false)}
                autoFocus
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
