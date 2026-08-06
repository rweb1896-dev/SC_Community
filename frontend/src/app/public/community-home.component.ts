import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBookOpen,
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideHeadphones,
  LucideImages,
  LucideMapPin,
  LucideNewspaper,
  LucideRadio
} from '@lucide/angular';
import { interval, Subscription } from 'rxjs';
import { COMMUNITY_LEADERS } from '../core/community-leaders';
import { CommunityApiService } from '../core/community-api.service';
import { COMMUNITY_NOTICES } from '../core/community-resources';
import { Broadcast, CommunityEvent, GalleryImage } from '../core/models';
import { managedLeaders } from '../core/managed-content';

type CommunitySection = 'leaders' | 'blogs' | 'events' | 'gallery' | 'live';

@Component({
  selector: 'app-community-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideArrowRight,
    LucideBookOpen,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
    LucideHeadphones,
    LucideImages,
    LucideMapPin,
    LucideNewspaper,
    LucideRadio
  ],
  templateUrl: './community-home.component.html',
  styleUrl: './community-home.component.css'
})
export class CommunityHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('leaderRail') leaderRail?: ElementRef<HTMLElement>;

  leaders = [...COMMUNITY_LEADERS];
  readonly notices = COMMUNITY_NOTICES;
  get blogPosts() { return this.leaders.flatMap((leader) =>
    leader.articles.map((article, articleIndex) => ({
      leaderId: leader.id,
      leaderName: leader.name,
      leaderRole: leader.role,
      imageUrl: leader.imageUrl,
      imagePosition: leader.imagePosition,
      articleIndex,
      title: article.title,
      summary: article.summary
    }))
  ); }
  events: CommunityEvent[] = [];
  galleryImages: GalleryImage[] = [];
  broadcasts: Broadcast[] = [];
  activeLeaderIndex = 0;
  safeEmbedUrl?: SafeResourceUrl;
  loading = true;
  contentError = '';

  private subscriptions = new Subscription();
  private revealObserver?: IntersectionObserver;
  private leaderTimer?: ReturnType<typeof setInterval>;
  private sectionElements: HTMLElement[] = [];
  private scrollFrame?: number;

  constructor(
    private api: CommunityApiService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  get scheduledEvents(): CommunityEvent[] {
    return this.events.filter((event) => event.status === 'SCHEDULED').slice(0, 4);
  }

  get liveBroadcast(): Broadcast | undefined {
    return this.broadcasts.find((broadcast) => broadcast.status === 'LIVE');
  }

  ngOnInit(): void {
    this.loadPublicContent();
    this.startLeaderRotation();
    this.subscriptions.add(interval(10000).subscribe(() => this.loadBroadcasts()));
    this.subscriptions.add(this.route.fragment.subscribe((fragment) => {
      if (fragment) setTimeout(() => document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' }), 60);
    }));
  }

  ngAfterViewInit(): void {
    this.sectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-community-section]'));
    window.addEventListener('scroll', this.handleSectionScroll, { passive: true });
    this.updateActiveSection();

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    this.sectionElements.forEach((section) => this.revealObserver?.observe(section));
  }

  scrollLeaders(direction: -1 | 1): void {
    this.activeLeaderIndex = (this.activeLeaderIndex + direction + this.leaders.length) % this.leaders.length;
    const rail = this.leaderRail?.nativeElement;
    const card = rail?.querySelector<HTMLElement>(`[data-leader-index="${this.activeLeaderIndex}"]`);
    if (rail && card) rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: 'smooth' });
  }

  pauseLeaderRotation(): void {
    if (this.leaderTimer) clearInterval(this.leaderTimer);
    this.leaderTimer = undefined;
  }

  startLeaderRotation(): void {
    this.pauseLeaderRotation();
    this.leaderTimer = setInterval(() => this.scrollLeaders(1), 6000);
  }

  ngOnDestroy(): void {
    this.pauseLeaderRotation();
    this.subscriptions.unsubscribe();
    window.removeEventListener('scroll', this.handleSectionScroll);
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    this.revealObserver?.disconnect();
  }

  private readonly handleSectionScroll = (): void => {
    if (this.scrollFrame) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = undefined;
      this.updateActiveSection();
    });
  };

  private updateActiveSection(): void {
    const activationLine = Math.min(window.innerHeight * 0.38, 340);
    let active: CommunitySection = 'leaders';
    const pageBottom = window.scrollY + window.innerHeight;
    if (pageBottom >= document.documentElement.scrollHeight - 2 && this.sectionElements.length) {
      active = this.sectionElements.at(-1)?.dataset['communitySection'] as CommunitySection;
      window.dispatchEvent(new CustomEvent('community-section-change', { detail: active }));
      return;
    }
    for (const element of this.sectionElements) {
      if (element.getBoundingClientRect().top > activationLine) break;
      active = element.dataset['communitySection'] as CommunitySection;
    }
    window.dispatchEvent(new CustomEvent('community-section-change', { detail: active }));
  }

  private loadPublicContent(): void {
    let requestsPending = 4;
    const completed = () => {
      requestsPending -= 1;
      if (requestsPending === 0) this.loading = false;
    };
    this.api.publicEvents().subscribe({
      next: (events) => { this.events = events; completed(); },
      error: () => { this.contentError = 'Some public updates are temporarily unavailable.'; completed(); }
    });
    this.api.publicGallery().subscribe({
      next: (images) => { this.galleryImages = images; completed(); },
      error: () => { this.contentError = 'Some public updates are temporarily unavailable.'; completed(); }
    });
    this.api.publicBroadcasts().subscribe({
      next: (broadcasts) => { this.broadcasts = broadcasts; this.updateEmbedUrl(); completed(); },
      error: () => { this.contentError = 'Some public updates are temporarily unavailable.'; completed(); }
    });
    this.api.publicManagedContent().subscribe({
      next: (items) => { this.leaders = managedLeaders(items); completed(); },
      error: () => { this.contentError = 'Some public updates are temporarily unavailable.'; completed(); }
    });
  }

  private loadBroadcasts(): void {
    this.api.publicBroadcasts().subscribe({
      next: (broadcasts) => { this.broadcasts = broadcasts; this.updateEmbedUrl(); }
    });
  }

  private updateEmbedUrl(): void {
    const live = this.liveBroadcast;
    if (!live || live.mediaType !== 'YOUTUBE') {
      this.safeEmbedUrl = undefined;
      return;
    }
    const videoId = this.youtubeVideoId(live.mediaUrl);
    this.safeEmbedUrl = videoId
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?rel=0`)
      : undefined;
  }

  private youtubeVideoId(value: string): string {
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      return ['embed', 'live', 'shorts'].includes(parts[0]) ? parts[1] || '' : '';
    } catch {
      return '';
    }
  }
}
