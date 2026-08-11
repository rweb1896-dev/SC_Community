import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideAward, LucideExternalLink } from '@lucide/angular';
import { CommunityApiService } from '../core/community-api.service';
import { Achiever, ExpertiseField } from '../core/models';

@Component({
  selector: 'app-achievers',
  standalone: true,
  imports: [CommonModule, LucideAward, LucideExternalLink],
  templateUrl: './achievers.component.html',
  styleUrls: ['./public-page.css', './achievers.component.css']
})
export class AchieversComponent implements OnInit {
  expertiseFields: ExpertiseField[] = [];
  achievers: Achiever[] = [];
  selectedField: number | 'ALL' = 'ALL';

  constructor(private api: CommunityApiService) {}

  ngOnInit(): void {
    this.api.expertiseFields().subscribe({ next: (fields) => this.expertiseFields = fields });
    this.api.publicAchievers().subscribe({ next: (achievers) => this.achievers = achievers });
  }

  get visibleAchievers(): Achiever[] {
    return this.selectedField === 'ALL' ? this.achievers : this.achievers.filter((item) => item.expertiseFieldId === this.selectedField);
  }

  get visibleFields(): ExpertiseField[] {
    const ids = new Set(this.achievers.map((item) => item.expertiseFieldId));
    return this.expertiseFields.filter((field) => ids.has(field.id));
  }

  initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }
}
