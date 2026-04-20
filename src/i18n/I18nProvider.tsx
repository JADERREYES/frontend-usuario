import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  languageOptions,
  translations,
  type LanguageCode,
} from './translations';

const LANGUAGE_KEY = 'menteamiga_language';

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: typeof translations.es;
  languageOptions: typeof languageOptions;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const isLanguageCode = (value: string | null): value is LanguageCode =>
  value === 'es' || value === 'en' || value === 'pt' || value === 'fr';

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return isLanguageCode(stored) ? stored : 'es';
  });

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    setLanguageState((current) => (current === nextLanguage ? current : nextLanguage));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language] || translations.es,
      languageOptions,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
