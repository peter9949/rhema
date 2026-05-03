import { useBroadcastStore } from "@/stores/broadcast-store"
import type { VerseRenderData } from "@/types"
import type { Verse } from "@/types"

interface SecondaryVerseOption {
  verse: Verse
  translation: string
}

export function toVerseRenderData(
  verse: Verse,
  translation: string,
  secondary?: SecondaryVerseOption,
): VerseRenderData {
  return {
    reference: `${verse.book_name} ${verse.chapter}:${verse.verse} (${translation})`,
    segments: [{ verseNumber: verse.verse, text: verse.text }],
    secondaryText: secondary?.verse.text,
    secondaryTranslation: secondary?.translation,
  }
}

export function deriveLiveVerse({
  isLive,
  selectedVerse,
  translation,
  secondaryVerse,
}: {
  isLive: boolean
  selectedVerse: Verse | null
  translation: string
  secondaryVerse?: SecondaryVerseOption | null
}): VerseRenderData | null {
  if (!isLive || !selectedVerse) return null
  return toVerseRenderData(selectedVerse, translation, secondaryVerse ?? undefined)
}

export const broadcastActions = {
  setLiveVerse: (verse: VerseRenderData | null) =>
    useBroadcastStore.getState().setLiveVerse(verse),
  setLive: (live: boolean) =>
    useBroadcastStore.getState().setLive(live),
  getActiveTheme: () => {
    const s = useBroadcastStore.getState()
    return s.themes.find((t) => t.id === s.activeThemeId) ?? s.themes[0]
  },
}
