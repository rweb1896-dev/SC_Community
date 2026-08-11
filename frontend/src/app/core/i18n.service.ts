import { Injectable, signal } from '@angular/core';
import { EN } from './locales/en';
import { HI } from './locales/hi';

export type AppLanguage = 'en' | 'hi';
const LANGUAGE_KEY = 'sc-connect-language';
const LANGUAGE_VERSION_KEY = 'sc-connect-language-version';
const HINDI_RELEASE = 'complete-hi-v1';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>(this.initialLanguage());

  constructor() { this.applyDocumentLanguage(this.language()); }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem(LANGUAGE_KEY, language);
    this.applyDocumentLanguage(language);
  }

  t(key: string): string {
    const dictionary = this.language() === 'hi' ? HI : EN;
    return dictionary[key as keyof typeof dictionary] || EN[key as keyof typeof EN] || key;
  }

  private initialLanguage(): AppLanguage {
    const release = typeof localStorage === 'undefined' ? null : localStorage.getItem(LANGUAGE_VERSION_KEY);
    if (release !== HINDI_RELEASE && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, 'hi');
      localStorage.setItem(LANGUAGE_VERSION_KEY, HINDI_RELEASE);
      return 'hi';
    }
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
    return 'hi';
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }
}
