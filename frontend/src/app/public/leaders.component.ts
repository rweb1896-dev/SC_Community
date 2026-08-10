import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideAward, LucideChevronLeft, LucideChevronRight, LucideExternalLink, LucideSearch } from '@lucide/angular';
import { COMMUNITY_LEADERS, CommunityLeader, LeaderEra } from '../core/community-leaders';
import { CommunityApiService } from '../core/community-api.service';
import { managedLeaders } from '../core/managed-content';
import { Achiever, ExpertiseField } from '../core/models';

type LeaderFilter = 'ALL' | LeaderEra;

@Component({
  selector: 'app-leaders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowRight, LucideAward, LucideChevronLeft, LucideChevronRight, LucideExternalLink, LucideSearch],
  templateUrl: './leaders.component.html',
  styleUrls: ['./public-page.css', './leaders.component.css']
})
export class LeadersComponent implements OnInit {
  @ViewChild('leaderRail') leaderRail?: ElementRef<HTMLElement>;
  leaders: readonly CommunityLeader[] = COMMUNITY_LEADERS;
  filter: LeaderFilter = 'ALL';
  query = '';
  expertiseFields: ExpertiseField[] = [];
  achievers: Achiever[] = [];
  selectedAchieverField: number | 'ALL' = 'ALL';

  constructor(private api: CommunityApiService) {}

  ngOnInit(): void {
    this.api.publicManagedContent().subscribe({ next: (items) => this.leaders = managedLeaders(items) });
    this.api.expertiseFields().subscribe({ next: (fields) => this.expertiseFields = fields });
    this.api.publicAchievers().subscribe({ next: (achievers) => this.achievers = achievers });
  }

  get visibleAchievers(): Achiever[] {
    return this.selectedAchieverField === 'ALL'
      ? this.achievers
      : this.achievers.filter((achiever) => achiever.expertiseFieldId === this.selectedAchieverField);
  }

  get achieverFields(): ExpertiseField[] {
    const fieldIds = new Set(this.achievers.map((achiever) => achiever.expertiseFieldId));
    return this.expertiseFields.filter((field) => fieldIds.has(field.id));
  }

  achieverInitials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

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
