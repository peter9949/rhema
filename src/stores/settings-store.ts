import { create } from "zustand"
import { load, type Store } from "@tauri-apps/plugin-store"

type SttProvider = "deepgram" | "whisper"

interface SettingsState {
  // Typography overrides (null = use active theme's value)
  typographyVerseFontFamily: string | null
  typographyVerseFontSize: number | null
  typographyVerseFontWeight: number | null
  typographyVerseLineHeight: number | null
  typographyReferenceFontSize: number | null
  typographyReferenceFontWeight: number | null

  deepgramApiKey: string | null
  openaiApiKey: string | null
  claudeApiKey: string | null
  audioDeviceId: string | null
  gain: number
  autoMode: boolean
  confidenceThreshold: number
  cooldownMs: number
  onboardingComplete: boolean
  sttProvider: SttProvider
  secondaryTranslationLanguage: string | null
  secondaryTranslationId: number | null

  setDeepgramApiKey: (key: string | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setClaudeApiKey: (key: string | null) => void
  setAudioDeviceId: (id: string | null) => void
  setGain: (gain: number) => void
  setAutoMode: (auto: boolean) => void
  setConfidenceThreshold: (threshold: number) => void
  setCooldownMs: (ms: number) => void
  setOnboardingComplete: (complete: boolean) => void
  setSttProvider: (provider: SttProvider) => void
  setSecondaryTranslationLanguage: (language: string | null) => void
  setSecondaryTranslationId: (id: number | null) => void
  setTypographyVerseFontFamily: (v: string | null) => void
  setTypographyVerseFontSize: (v: number | null) => void
  setTypographyVerseFontWeight: (v: number | null) => void
  setTypographyVerseLineHeight: (v: number | null) => void
  setTypographyReferenceFontSize: (v: number | null) => void
  setTypographyReferenceFontWeight: (v: number | null) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
    typographyVerseFontFamily: null,
    typographyVerseFontSize: null,
    typographyVerseFontWeight: null,
    typographyVerseLineHeight: null,
    typographyReferenceFontSize: null,
    typographyReferenceFontWeight: null,

  deepgramApiKey: null,
  openaiApiKey: null,
  claudeApiKey: null,
  audioDeviceId: null,
  gain: 1.0,
  autoMode: false,
  confidenceThreshold: 0.8,
  cooldownMs: 2500,
  onboardingComplete: false,
  sttProvider: "deepgram",
  secondaryTranslationLanguage: "pl",
  secondaryTranslationId: null,

  setDeepgramApiKey: (deepgramApiKey) => set({ deepgramApiKey }),
  setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),
  setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
  setAudioDeviceId: (audioDeviceId) => set({ audioDeviceId }),
  setGain: (gain) => set({ gain }),
  setAutoMode: (autoMode) => set({ autoMode }),
  setConfidenceThreshold: (confidenceThreshold) => set({ confidenceThreshold }),
  setCooldownMs: (cooldownMs) => set({ cooldownMs }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  setSttProvider: (sttProvider) => set({ sttProvider }),
  setSecondaryTranslationLanguage: (secondaryTranslationLanguage) =>
    set({ secondaryTranslationLanguage }),
  setSecondaryTranslationId: (secondaryTranslationId) =>
    set({ secondaryTranslationId }),
  setTypographyVerseFontFamily: (typographyVerseFontFamily) => set({ typographyVerseFontFamily }),
  setTypographyVerseFontSize: (typographyVerseFontSize) => set({ typographyVerseFontSize }),
  setTypographyVerseFontWeight: (typographyVerseFontWeight) => set({ typographyVerseFontWeight }),
  setTypographyVerseLineHeight: (typographyVerseLineHeight) => set({ typographyVerseLineHeight }),
  setTypographyReferenceFontSize: (typographyReferenceFontSize) => set({ typographyReferenceFontSize }),
  setTypographyReferenceFontWeight: (typographyReferenceFontWeight) => set({ typographyReferenceFontWeight }),
}))

const PERSISTED_KEYS = [
  "deepgramApiKey",
  "openaiApiKey",
  "claudeApiKey",
  "audioDeviceId",
  "gain",
  "autoMode",
  "confidenceThreshold",
  "cooldownMs",
  "onboardingComplete",
  "sttProvider",
  "secondaryTranslationLanguage",
  "secondaryTranslationId",
  "typographyVerseFontFamily",
  "typographyVerseFontSize",
  "typographyVerseFontWeight",
  "typographyVerseLineHeight",
  "typographyReferenceFontSize",
  "typographyReferenceFontWeight",
] as const satisfies readonly (keyof SettingsState)[]

let tauriStore: Store | null = null
let hydrationPromise: Promise<void> | null = null

async function getStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await load("settings.json", { autoSave: false, defaults: {} })
  }
  return tauriStore
}

/** Load all persisted settings into the Zustand store. Idempotent and
 *  safe against concurrent callers — the first call owns the work and
 *  subsequent callers await the same promise. */
export function hydrateSettings(): Promise<void> {
  if (hydrationPromise) return hydrationPromise
  hydrationPromise = (async () => {
    try {
      const store = await getStore()
      const patch: Partial<SettingsState> = {}
      for (const key of PERSISTED_KEYS) {
        const value = await store.get(key)
        if (value !== undefined && value !== null) {
          ;(patch as Record<string, unknown>)[key] = value
        }
      }
      if (Object.keys(patch).length > 0) {
        useSettingsStore.setState(patch)
      }

      // Attach only after successful hydration so as not to overwrite disk with defaults.
      // Debounce writes, so a dragged slider (e.g. gain) coalesces into a single disk write.
      useSettingsStore.subscribe((state, prevState) => {
        const changed = PERSISTED_KEYS.some((k) => state[k] !== prevState[k])
        if (!changed) return
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          saveTimer = null
          pendingSave = pendingSave.then(() =>
            persistAll(useSettingsStore.getState())
          )
        }, SAVE_DEBOUNCE_MS)
      })
    } catch {
      console.warn("[settings] Failed to load persisted state, using defaults")
    }
  })()
  return hydrationPromise
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingSave: Promise<void> = Promise.resolve()
const SAVE_DEBOUNCE_MS = 250

async function persistAll(state: SettingsState): Promise<void> {
  try {
    const store = await getStore()
    for (const key of PERSISTED_KEYS) {
      await store.set(key, state[key] as unknown)
    }
    await store.save()
  } catch {
    console.warn("[settings] Failed to persist settings")
  }
}
