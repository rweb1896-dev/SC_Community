import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideExternalLink, LucideFileText, LucideShoppingBag } from '@lucide/angular';
import { COMMUNITY_BOOKS, type CommunityBook, PAID_COMMUNITY_BOOKS } from '../core/community-resources';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, LucideExternalLink, LucideFileText, LucideShoppingBag],
  templateUrl: './library.component.html',
  styleUrls: ['./public-page.css', './library.component.css']
})
export class LibraryComponent {
  readonly books = COMMUNITY_BOOKS;
  readonly paidBooks = PAID_COMMUNITY_BOOKS;

  pdfHref(book: CommunityBook): string {
    return `/api/public/books/${encodeURIComponent(book.id)}/pdf`;
  }
}
