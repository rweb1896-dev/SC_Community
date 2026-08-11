import { effect, Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
import { translateUiText } from './ui-hi';

@Injectable({ providedIn: 'root' })
export class UiLocalizationService {
  private observer?: MutationObserver;
  private root?: HTMLElement;
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private nativeDialogsWrapped = false;

  constructor(private i18n: I18nService) {
    effect(() => { this.i18n.language(); queueMicrotask(() => this.localize()); });
  }

  start(root: HTMLElement = document.body): void {
    this.root = root;
    this.wrapNativeDialogs();
    this.localize();
    this.observer?.disconnect();
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target instanceof Text) this.localizeText(mutation.target);
        if (mutation.type === 'attributes' && mutation.target instanceof Element) this.localizeElement(mutation.target);
        mutation.addedNodes.forEach((node) => this.localizeNode(node));
      }
    });
    this.observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }

  private localize(): void { if (this.root) this.localizeNode(this.root); }

  private localizeNode(node: Node): void {
    if (node instanceof Text) { this.localizeText(node); return; }
    if (!(node instanceof Element)) return;
    if (['SCRIPT', 'STYLE'].includes(node.tagName)) return;
    this.localizeElement(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current instanceof Text) this.localizeText(current);
      else if (current instanceof Element) this.localizeElement(current);
    }
  }

  private localizeText(node: Text): void {
    const value = node.nodeValue || '';
    if (!value.trim()) return;
    if (this.i18n.language() === 'en') {
      const original = this.originalText.get(node);
      if (original !== undefined && value !== original) node.nodeValue = original;
      return;
    }
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const source = value.trim();
    const translated = translateUiText(source);
    if (translated !== source) {
      this.originalText.set(node, value);
      node.nodeValue = `${leading}${translated}${trailing}`;
    }
  }

  private localizeElement(element: Element): void {
    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      if (this.i18n.language() === 'en') {
        const original = this.originalAttributes.get(element)?.get(attribute);
        if (original && value !== original) element.setAttribute(attribute, original);
        continue;
      }
      const translated = translateUiText(value);
      if (translated === value) continue;
      let originals = this.originalAttributes.get(element);
      if (!originals) { originals = new Map(); this.originalAttributes.set(element, originals); }
      originals.set(attribute, value);
      element.setAttribute(attribute, translated);
    }
  }

  private wrapNativeDialogs(): void {
    if (this.nativeDialogsWrapped || typeof window === 'undefined') return;
    this.nativeDialogsWrapped = true;
    const alertFn = window.alert.bind(window), confirmFn = window.confirm.bind(window), promptFn = window.prompt.bind(window);
    window.alert = (message?: unknown) => alertFn(this.dialogText(message));
    window.confirm = (message?: string) => confirmFn(this.dialogText(message));
    window.prompt = (message?: string, defaultValue?: string) => promptFn(this.dialogText(message), defaultValue);
  }

  private dialogText(message: unknown): string {
    const value = String(message ?? '');
    return this.i18n.language() === 'hi' ? translateUiText(value) : value;
  }
}
