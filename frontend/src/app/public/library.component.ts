import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideExternalLink, LucideFileText, LucideShoppingBag } from '@lucide/angular';
import { COMMUNITY_BOOKS, type CommunityBook, PAID_COMMUNITY_BOOKS } from '../core/community-resources';
import { CommunityApiService } from '../core/community-api.service';
import { managedBooks } from '../core/managed-content';
import { I18nService } from '../core/i18n.service';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LucideExternalLink, LucideFileText, LucideShoppingBag],
  templateUrl: './library.component.html',
  styleUrls: ['./public-page.css', './library.component.css']
})
export class LibraryComponent implements OnInit {
  books = [...COMMUNITY_BOOKS];
  paidBooks = [...PAID_COMMUNITY_BOOKS];

  constructor(private api: CommunityApiService, public i18n: I18nService) {}

  get visibleBooks(): CommunityBook[] {
    const preferred = this.books.filter((book) => this.isHindi(book) === (this.i18n.language() === 'hi'));
    return preferred.length ? preferred : this.books;
  }

  get usingLanguageFallback(): boolean {
    return this.i18n.language() === 'hi' && !this.books.some((book) => this.isHindi(book));
  }

  ngOnInit(): void {
    this.api.publicManagedContent().subscribe({ next: (items) => {
      const library = managedBooks(items);
      this.books = library.books;
      this.paidBooks = library.paidBooks;
    }});
  }

  pdfHref(book: CommunityBook): string {
    return COMMUNITY_BOOKS.some((item) => item.id === book.id && item.pdfUrl === book.pdfUrl)
      ? `/api/public/books/${encodeURIComponent(book.id)}/pdf`
      : book.pdfUrl;
  }

  private isHindi(book: CommunityBook): boolean { return /hindi|हिन्दी|हिंदी/i.test(book.language); }
}
