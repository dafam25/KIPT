'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { id } from './id';
import { en } from './en';
import type { Dictionary } from './id';

export type Language = 'id' | 'en';

const DICTIONARIES: Record<Language, Dictionary> = { id, en };
const STORAGE_KEY = 'kipt-language';

function resolvePath(dict: Dictionary, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Reading the persisted language after mount (rather than in a lazy useState
    // initializer) is deliberate: the initial render must match the server-rendered
    // 'id' default exactly, or React logs a hydration mismatch. Swapping the language
    // once mounted is the standard hydration-safe pattern for persisted UI preferences.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === 'id' || stored === 'en') setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      const value = resolvePath(DICTIONARIES[language], path);
      if (typeof value !== 'string') return path;
      return interpolate(value, params);
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
