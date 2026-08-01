import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideCalendarDays, LucideExternalLink, LucideMapPin, LucideMegaphone } from '@lucide/angular';
import { CommunityApiService } from '../core/community-api.service';
import { COMMUNITY_NOTICES } from '../core/community-resources';
import { CommunityEvent } from '../core/models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, LucideCalendarDays, LucideExternalLink, LucideMapPin, LucideMegaphone],
  templateUrl: './events.component.html',
  styleUrls: ['./public-page.css', './events.component.css']
})
export class EventsComponent implements OnInit {
  readonly notices = COMMUNITY_NOTICES;
  events: CommunityEvent[] = [];
  loading = true;
  error = '';

  constructor(private api: CommunityApiService) {}

  get scheduledEvents(): CommunityEvent[] {
    return this.events.filter((event) => event.status === 'SCHEDULED');
  }

  ngOnInit(): void {
    this.api.publicEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: () => {
        this.error = 'Events could not be loaded. Please try again shortly.';
        this.loading = false;
      }
    });
  }
}
