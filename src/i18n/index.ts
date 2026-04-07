import es from './es.json';
import en from './en.json';
import de from './de.json';
import fr from './fr.json';
import pt from './pt.json';

const translations: Record<string, typeof es> = { es, en, de, fr, pt };

export const LOCALES = ['en', 'es', 'de', 'fr', 'pt'] as const;
export type Locale = typeof LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
};

export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && LOCALES.includes(first as Locale)) {
    return first as Locale;
  }
  return 'en'; // default
}

export function t(locale: Locale): typeof es {
  return translations[locale] || translations.en;
}

export function localePath(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  return `/${locale}${path}`;
}

export function timeAgo(date: Date, locale: Locale): string {
  const i = t(locale);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `< 1 ${i.common.time_min}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${i.common.time_min}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}${i.common.time_hour}`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}${i.common.time_day}`;
  return `${Math.floor(seconds / 2592000)}${i.common.time_month}`;
}
