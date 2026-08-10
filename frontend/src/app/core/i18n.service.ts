import { Injectable, signal } from '@angular/core';
import { EN } from './locales/en';
import { HI } from './locales/hi';

export type AppLanguage = 'en' | 'hi';
const LANGUAGE_KEY = 'sc-connect-language';

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
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }
}
