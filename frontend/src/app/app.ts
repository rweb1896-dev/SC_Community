import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideBookOpen, LucideCalendarDays, LucideChevronDown, LucideHouse, LucideImages, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideShieldCheck, LucideUsersRound, LucideVideo } from '@lucide/angular';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf, FormsModule, LucideBookOpen, LucideCalendarDays, LucideChevronDown, LucideHouse, LucideImages, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideShieldCheck, LucideUsersRound, LucideVideo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  menuOpen = false;
  profileOpen = false;
  searchTerm = '';
  publicSection = 'leaders';

  constructor(public auth: AuthService, public router: Router) {}

  logout(): void {
    this.menuOpen = false;
    this.profileOpen = false;
    this.auth.logout();
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  selectPublicSection(section: string): void {
    this.publicSection = section;
    this.closeMenu();
  }

  isPublicSection(section: string): boolean {
    if (this.router.url.startsWith('/community')) return this.publicSection === section;
    if (section === 'leaders') return this.router.url.startsWith('/leaders');
    if (section === 'events') return this.router.url.startsWith('/events');
    if (section === 'live') return this.router.url.startsWith('/live');
    return false;
  }

  @HostListener('window:community-section-change', ['$event'])
  updatePublicSection(event: Event): void {
    this.publicSection = (event as CustomEvent<string>).detail;
  }

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeProfile(): void {
    this.profileOpen = false;
  }

  search(): void {
    this.router.navigate(['/feed'], { queryParams: this.searchTerm.trim() ? { q: this.searchTerm.trim() } : {} });
  }

}
