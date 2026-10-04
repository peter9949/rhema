import type { BroadcastTheme } from "@/types/broadcast"

export interface TypographyOverrides {
  verseFontFamily: string | null
  verseFontSize: number | null
  verseFontWeight: number | null
  verseLineHeight: number | null
  referenceFontSize: number | null
  referenceFontWeight: number | null
}

export function applyTypographyOverrides(
  theme: BroadcastTheme,
  overrides: TypographyOverrides,
): BroadcastTheme {
  const {
    verseFontFamily,
    verseFontSize,
    verseFontWeight,
    verseLineHeight,
    referenceFontSize,
    referenceFontWeight,
  } = overrides

  if (
    verseFontFamily == null
    && verseFontSize == null
    && verseFontWeight == null
    && verseLineHeight == null
    && referenceFontSize == null
    && referenceFontWeight == null
  ) {
    return theme
  }

  return {
    ...theme,
    verseText: {
      ...theme.verseText,
      fontFamily: verseFontFamily ?? theme.verseText.fontFamily,
      fontSize: verseFontSize ?? theme.verseText.fontSize,
      fontWeight: verseFontWeight ?? theme.verseText.fontWeight,
      lineHeight: verseLineHeight ?? theme.verseText.lineHeight,
    },
    reference: {
      ...theme.reference,
      fontSize: referenceFontSize ?? theme.reference.fontSize,
      fontWeight: referenceFontWeight ?? theme.reference.fontWeight,
    },
  }
}