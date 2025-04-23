import en from './en';
import nl from './nl';

type Locales = 'en' | 'nl';
type Translations = Record<Locales, typeof en>;

export const translations: Translations = {
  en,
  nl,
};

export function getTranslations(locale: string) {
  return translations[locale as Locales] || translations.en;
}
