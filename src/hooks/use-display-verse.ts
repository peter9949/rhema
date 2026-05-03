import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"

import { useBibleStore, useSettingsStore } from "@/stores"
import type { Translation, Verse, VerseRenderData } from "@/types"
import { toVerseRenderData } from "@/hooks/use-broadcast"

function findTranslation(
  translations: Translation[],
  translationId: number | null,
): Translation | undefined {
  if (translationId == null) return undefined
  return translations.find((translation) => translation.id === translationId)
}

export function useDisplayVerseData(
  selectedVerse: Verse | null,
): VerseRenderData | null {
  const translations = useBibleStore((s) => s.translations)
  const activeTranslationId = useBibleStore((s) => s.activeTranslationId)
  const secondaryTranslationId = useSettingsStore(
    (s) => s.secondaryTranslationId,
  )
  const [secondaryVerse, setSecondaryVerse] = useState<Verse | null>(null)

  useEffect(() => {
    let cancelled = false

    if (
      !selectedVerse ||
      secondaryTranslationId == null ||
      secondaryTranslationId === activeTranslationId
    ) {
      setSecondaryVerse(null)
      return () => {
        cancelled = true
      }
    }

    setSecondaryVerse(null)

    invoke<Verse | null>("get_verse", {
      translationId: secondaryTranslationId,
      bookNumber: selectedVerse.book_number,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
    })
      .then((verse) => {
        if (!cancelled) {
          setSecondaryVerse(verse)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSecondaryVerse(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    activeTranslationId,
    secondaryTranslationId,
    selectedVerse?.book_number,
    selectedVerse?.chapter,
    selectedVerse?.verse,
  ])

  if (!selectedVerse) {
    return null
  }

  const primaryTranslation =
    findTranslation(translations, activeTranslationId)?.abbreviation ?? "KJV"
  const secondaryTranslation = findTranslation(
    translations,
    secondaryTranslationId,
  )?.abbreviation

  return toVerseRenderData(
    selectedVerse,
    primaryTranslation,
    secondaryVerse && secondaryTranslation
      ? { verse: secondaryVerse, translation: secondaryTranslation }
      : undefined,
  )
}