/**
 * VisionX — Accessibility Context & Provider
 * Centralized state management for application-wide accessibility preferences:
 * - Text Size (normal, large, extra-large)
 * - High Contrast Mode (true, false)
 * - Reduced Motion (true, false)
 * - Additional audio, interaction, and language preferences
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
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

const STORAGE_KEY = 'visionx_accessibility_settings'

const AccessibilityContext = createContext({
  settings: DEFAULT_ACCESSIBILITY_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
  setTextSize: () => {},
  setHighContrast: () => {},
  setReducedMotion: () => {},
})

export function AccessibilityProvider({ children }) {
  // FUTURE FRONTEND ENHANCEMENT:
  // Persist accessibility preferences using browser localStorage
  // and restore them when VisionX loads.
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed }
      }
    } catch {
      // ignore storage error
    }

    // Default with OS preference fallback for reduced motion
    const systemPrefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      reducedMotion: Boolean(systemPrefersReducedMotion),
    }
  })

  // Apply data-attributes directly to <html> element whenever settings change
  useEffect(() => {
    const root = document.documentElement

    // 1. Text Size
    root.dataset.textSize = settings.textSize || 'normal'

    // 2. High Contrast
    root.dataset.highContrast = String(Boolean(settings.highContrast))

    // 3. Reduced Motion
    root.dataset.reducedMotion = String(Boolean(settings.reducedMotion))

    // 4. Large Controls (for extra touch target sizing)
    root.dataset.largeControls = String(Boolean(settings.largeControls))

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage error
    }
  }, [settings])

  // Listen for system reduced motion change if user hasn't set an explicit custom profile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) {
          setSettings((prev) => ({ ...prev, reducedMotion: e.matches }))
        }
      } catch {
        // ignore
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const setTextSize = useCallback((size) => {
    updateSetting('textSize', size)
  }, [updateSetting])

  const setHighContrast = useCallback((enabled) => {
    updateSetting('highContrast', enabled)
  }, [updateSetting])

  const setReducedMotion = useCallback((enabled) => {
    updateSetting('reducedMotion', enabled)
  }, [updateSetting])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCESSIBILITY_SETTINGS))
    } catch {
      // ignore
    }
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        setTextSize,
        setHighContrast,
        setReducedMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export default AccessibilityContext
