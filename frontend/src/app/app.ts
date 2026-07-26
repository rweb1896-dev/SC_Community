import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideChevronDown, LucideHouse, LucideLogOut, LucideMessageCircle, LucideSearch, LucideShieldCheck, LucideVideo } from '@lucide/angular';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf, FormsModule, LucideChevronDown, LucideHouse, LucideLogOut, LucideMessageCircle, LucideSearch, LucideShieldCheck, LucideVideo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  menuOpen = false;
  profileOpen = false;
  searchTerm = '';

  constructor(public auth: AuthService, private router: Router) {}

  logout(): void {
    this.menuOpen = false;
    this.profileOpen = false;
    this.auth.logout();
  }

  closeMenu(): void {
    this.menuOpen = false;
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
