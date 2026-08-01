import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideClock3, LucideHeadphones, LucideRadio, LucideVideo } from '@lucide/angular';
import { interval, Subscription } from 'rxjs';
import { CommunityApiService } from '../core/community-api.service';
import { Broadcast } from '../core/models';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [CommonModule, LucideClock3, LucideHeadphones, LucideRadio, LucideVideo],
  templateUrl: './live.component.html',
  styleUrls: ['./public-page.css', './live.component.css']
})
export class LiveComponent implements OnInit, OnDestroy {
  broadcasts: Broadcast[] = [];
  loading = true;
  error = '';
  safeEmbedUrl?: SafeResourceUrl;
  private refreshSubscription?: Subscription;

  constructor(private api: CommunityApiService, private sanitizer: DomSanitizer) {}

  get liveBroadcast(): Broadcast | undefined {
    return this.broadcasts.find((broadcast) => broadcast.status === 'LIVE');
  }

  get programmeArchive(): Broadcast[] {
    return this.broadcasts.filter((broadcast) => broadcast.status !== 'DRAFT');
  }

  ngOnInit(): void {
    this.loadBroadcasts();
    this.refreshSubscription = interval(10000).subscribe(() => this.loadBroadcasts(false));
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private loadBroadcasts(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.api.publicBroadcasts().subscribe({
      next: (broadcasts) => {
        this.broadcasts = broadcasts;
        this.updateEmbedUrl();
        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'The live desk is temporarily unavailable.';
        this.loading = false;
      }
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
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`)
      : undefined;
  }

  private youtubeVideoId(value: string): string {
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'shorts') return parts[1] || '';
      return '';
    } catch {
      return '';
    }
  }
}
