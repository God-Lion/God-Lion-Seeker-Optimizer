import React from 'react'
import type { Locale } from 'src/configs/i18n'

const dictionaries = {
  en: () =>
    import('src/data/dictionaries/en.json').then((module) => module.default),
  fr: () =>
    import('src/data/dictionaries/fr.json').then((module) => module.default),
  ar: () =>
    import('src/data/dictionaries/ar.json').then((module) => module.default),
}

/**
 * Hook to load translations
 * Uses local dictionary files instead of API calls
 */
export const useLang = (code?: Locale): Record<string, string | object> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [lang, setLang] = React.useState<Record<string, string | object>>({})

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    const fetchLang = async () => {
      try {
        const locale = code || 'en'
        const dictionary = await getDictionary(locale as Locale)
        setLang(dictionary)
      } catch (error) {
        console.warn(`Translation file for ${code} not available, using fallback`)
        setLang({}) // Fallback to empty object
      }
    }

    fetchLang()
  }, [code])

  return lang
}

/**
 * Get dictionary by locale
 * Loads dictionary files from local imports
 */
export const getDictionary = async (locale: Locale) => {
  try {
    return await dictionaries[locale]()
  } catch (error) {
    console.warn(`Dictionary for locale ${locale} not found, falling back to en`)
    return await dictionaries.en()
  }
}
