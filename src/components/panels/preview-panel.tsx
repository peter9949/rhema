import { useEffect } from "react"
import { PanelHeader } from "@/components/ui/panel-header"
import { CanvasVerse } from "@/components/ui/canvas-verse"
import { useBibleStore, useBroadcastStore } from "@/stores"
import { bibleActions } from "@/hooks/use-bible"
import { useDisplayVerseData } from "@/hooks/use-display-verse"
import { useSettingsStore } from "@/stores/settings-store"
import { applyTypographyOverrides } from "@/lib/typography-overrides"

export function PreviewPanel() {
  const selectedVerse = useBibleStore((s) => s.selectedVerse)
  const activeTranslationId = useBibleStore((s) => s.activeTranslationId)
  const verseData = useDisplayVerseData(selectedVerse)

  // When translation changes, re-fetch the selected verse in the new translation
  useEffect(() => {
    const verse = useBibleStore.getState().selectedVerse
    if (verse && verse.book_number > 0 && verse.chapter > 0 && verse.verse > 0) {
      bibleActions
        .fetchVerse(verse.book_number, verse.chapter, verse.verse)
        .then((v) => {
          if (v) bibleActions.selectVerse(v)
        })
        .catch(() => {})
    }
  }, [activeTranslationId])
  const themes = useBroadcastStore((s) => s.themes)
  const activeThemeId = useBroadcastStore((s) => s.activeThemeId)
  const typographyVerseFontFamily = useSettingsStore((s) => s.typographyVerseFontFamily)
  const typographyVerseFontSize = useSettingsStore((s) => s.typographyVerseFontSize)
  const typographyVerseFontWeight = useSettingsStore((s) => s.typographyVerseFontWeight)
  const typographyVerseLineHeight = useSettingsStore((s) => s.typographyVerseLineHeight)
  const typographyReferenceFontSize = useSettingsStore((s) => s.typographyReferenceFontSize)
  const typographyReferenceFontWeight = useSettingsStore((s) => s.typographyReferenceFontWeight)

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? themes[0]
  const effectiveTheme = activeTheme
    ? applyTypographyOverrides(activeTheme, {
        verseFontFamily: typographyVerseFontFamily,
        verseFontSize: typographyVerseFontSize,
        verseFontWeight: typographyVerseFontWeight,
        verseLineHeight: typographyVerseLineHeight,
        referenceFontSize: typographyReferenceFontSize,
        referenceFontWeight: typographyReferenceFontWeight,
      })
    : activeTheme

  return (
    <div
      data-slot="preview-panel"
      className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card"
    >
      <PanelHeader title="Program preview" />
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <CanvasVerse theme={effectiveTheme} verse={verseData} />
      </div>
    </div>
  )
}
