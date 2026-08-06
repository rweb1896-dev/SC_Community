import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideExternalLink, LucideFileText, LucideShoppingBag } from '@lucide/angular';
import { COMMUNITY_BOOKS, type CommunityBook, PAID_COMMUNITY_BOOKS } from '../core/community-resources';
import { CommunityApiService } from '../core/community-api.service';
import { managedBooks } from '../core/managed-content';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, LucideExternalLink, LucideFileText, LucideShoppingBag],
  templateUrl: './library.component.html',
  styleUrls: ['./public-page.css', './library.component.css']
})
export class LibraryComponent implements OnInit {
  books = [...COMMUNITY_BOOKS];
  paidBooks = [...PAID_COMMUNITY_BOOKS];

  constructor(private api: CommunityApiService) {}

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
}
