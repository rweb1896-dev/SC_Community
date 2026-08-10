import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideBookOpen, LucideCalendarDays, LucideCheck, LucideChevronDown, LucideClock3, LucideCopy, LucideHouse, LucideImages, LucideKeyRound, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideSend, LucideShare2, LucideShieldCheck, LucideUsersRound, LucideVideo, LucideX } from '@lucide/angular';
import { AuthService } from './core/auth.service';
import { CommunityApiService } from './core/community-api.service';
import { MemberInviteRequest } from './core/models';
import { interval, Subscription } from 'rxjs';
import { AppLanguage, I18nService } from './core/i18n.service';
import { TranslatePipe } from './core/translate.pipe';
import { MessageDockComponent } from './chat/message-dock.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, DatePipe, NgIf, FormsModule, TranslatePipe, MessageDockComponent, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideChevronDown, LucideClock3, LucideCopy, LucideHouse, LucideImages, LucideKeyRound, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideSend, LucideShare2, LucideShieldCheck, LucideUsersRound, LucideVideo, LucideX],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  menuOpen = false;
  profileOpen = false;
  searchTerm = '';
  publicSection = 'leaders';
  inviteWorkspaceOpen = false;
  inviteRequest?: MemberInviteRequest;
  inviteRecipientMode: 'EMAIL' | 'MOBILE' = 'EMAIL';
  inviteRecipient = '';
  inviteLoading = false;
  inviteFeedback = '';
  inviteCopied = false;
  messageOpenRequest = 0;
  private inviteCreatingNew = false;
  private subscriptions = new Subscription();

  constructor(public auth: AuthService, public router: Router, private api: CommunityApiService, public i18n: I18nService) {}

  changeLanguage(value: string): void { this.i18n.setLanguage(value as AppLanguage); }
  openMessages(): void {
    this.menuOpen = false;
    this.messageOpenRequest += 1;
  }

  ngOnInit(): void {
    this.subscriptions.add(this.auth.session$.subscribe((session) => {
      if (session) this.refreshMemberInvite(false);
      else { this.inviteRequest = undefined; this.inviteWorkspaceOpen = false; }
    }));
    this.subscriptions.add(interval(7000).subscribe(() => {
      if (this.auth.session) this.refreshMemberInvite(true);
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  get memberInviteMessage(): string {
    const code = this.inviteRequest?.inviteCode;
    if (!code) return '';
    const url = `${window.location.origin}/login?mode=register&invite=${encodeURIComponent(code)}`;
    return `You're invited to join SC Community Connect.\n\nRegister here: ${url}\nInvite code: ${code}\nEmail OTP: SC1E\nMobile OTP: SC2M\n\nThis invite code can be used once.`;
  }

  openInviteWorkspace(): void {
    this.menuOpen = false; this.profileOpen = false; this.inviteWorkspaceOpen = true;
    this.inviteFeedback = ''; this.refreshMemberInvite(false);
  }

  closeInviteWorkspace(): void { this.inviteWorkspaceOpen = false; this.inviteFeedback = ''; }

  requestMemberInvite(): void {
    const value = this.inviteRecipient.trim();
    const email = this.inviteRecipientMode === 'EMAIL' ? value : '';
    const mobile = this.inviteRecipientMode === 'MOBILE' ? value.replace(/[\s()-]/g, '') : '';
    if ((email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (mobile && !/^\+?[1-9]\d{9,14}$/.test(mobile))) {
      this.inviteFeedback = this.inviteRecipientMode === 'EMAIL' ? 'Enter a valid email address.' : 'Enter a valid mobile number with country code.'; return;
    }
    this.inviteLoading = true; this.inviteFeedback = '';
    this.api.requestMemberInvite(email, mobile).subscribe({
      next: (request) => { this.inviteCreatingNew = false; this.inviteRequest = request; this.inviteRecipient = ''; this.inviteLoading = false; },
      error: (error) => { this.inviteFeedback = error.error?.detail || 'Request could not be sent'; this.inviteLoading = false; }
    });
  }

  copyMemberInvite(): void {
    navigator.clipboard.writeText(this.memberInviteMessage).then(() => {
      this.inviteCopied = true; setTimeout(() => this.inviteCopied = false, 1800);
    }).catch(() => this.inviteFeedback = 'Copy failed. Select the message and copy it manually.');
  }

  shareMemberInvite(): void {
    if (navigator.share) navigator.share({ title: 'SC Community Connect invite', text: this.memberInviteMessage })
      .catch(() => undefined);
    else this.copyMemberInvite();
  }

  newMemberInviteRequest(): void { this.inviteCreatingNew = true; this.inviteRequest = undefined; this.inviteFeedback = ''; }

  private refreshMemberInvite(openOnApproval: boolean): void {
    this.api.myInviteRequests().subscribe({ next: (requests) => {
      if (this.inviteCreatingNew) return;
      const previous = this.inviteRequest;
      this.inviteRequest = requests[0];
      if (openOnApproval && this.inviteRequest?.status !== 'PENDING' && previous?.status === 'PENDING') {
        this.inviteWorkspaceOpen = true;
      }
    }});
  }

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
