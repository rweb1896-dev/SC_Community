import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideChevronLeft, LucideChevronRight, LucideSearch } from '@lucide/angular';
import { COMMUNITY_LEADERS, CommunityLeader, LeaderEra } from '../core/community-leaders';

type LeaderFilter = 'ALL' | LeaderEra;

@Component({
  selector: 'app-leaders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowRight, LucideChevronLeft, LucideChevronRight, LucideSearch],
  templateUrl: './leaders.component.html',
  styleUrls: ['./public-page.css', './leaders.component.css']
})
export class LeadersComponent {
  @ViewChild('leaderRail') leaderRail?: ElementRef<HTMLElement>;
  readonly leaders = COMMUNITY_LEADERS;
  filter: LeaderFilter = 'ALL';
  query = '';

  get visibleLeaders(): readonly CommunityLeader[] {
    const query = this.query.trim().toLowerCase();
    return this.leaders.filter((leader) =>
      (this.filter === 'ALL' || leader.era === this.filter) &&
      (!query || `${leader.name} ${leader.role} ${leader.department} ${leader.contribution}`.toLowerCase().includes(query))
    );
  }

  setFilter(filter: LeaderFilter): void {
    this.filter = filter;
  }

  scrollLeaders(direction: number): void {
    this.leaderRail?.nativeElement.scrollBy({ left: direction * 420, behavior: 'smooth' });
  }
}
