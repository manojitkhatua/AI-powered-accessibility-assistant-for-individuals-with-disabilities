/**
 * VisionX — Accessibility Context & Provider
 * Centralized state management for application-wide accessibility preferences:
 * - Text Size (normal, large, extra-large)
 * - High Contrast Mode (true, false)
 * - Reduced Motion (true, false)
 * - Additional audio, interaction, and language preferences
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  textSize: 'normal',
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
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        const parsed = JSON.parse(saved)

        return {
          ...DEFAULT_ACCESSIBILITY_SETTINGS,
          ...parsed,
        }
      }
    } catch {
      // Ignore invalid or unavailable localStorage data.
    }

    const systemPrefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      reducedMotion: Boolean(systemPrefersReducedMotion),
    }
  })

  useEffect(() => {
    const root = document.documentElement

    root.dataset.textSize = settings.textSize || 'normal'
    root.dataset.highContrast = String(Boolean(settings.highContrast))
    root.dataset.reducedMotion = String(Boolean(settings.reducedMotion))
    root.dataset.largeControls = String(Boolean(settings.largeControls))

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore localStorage errors.
    }
  }, [settings])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined
    }

    const mediaQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    const handleChange = (event) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)

        if (!saved) {
          setSettings((previous) => ({
            ...previous,
            reducedMotion: event.matches,
          }))
        }
      } catch {
        // Ignore storage errors.
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))
  }, [])

  const setTextSize = useCallback(
    (size) => {
      updateSetting('textSize', size)
    },
    [updateSetting],
  )

  const setHighContrast = useCallback(
    (enabled) => {
      updateSetting('highContrast', enabled)
    },
    [updateSetting],
  )

  const setReducedMotion = useCallback(
    (enabled) => {
      updateSetting('reducedMotion', enabled)
    },
    [updateSetting],
  )

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS)

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_ACCESSIBILITY_SETTINGS),
      )
    } catch {
      // Ignore localStorage errors.
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const context = useContext(AccessibilityContext)

  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider',
    )
  }

  return context
}