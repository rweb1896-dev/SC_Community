import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideBookOpen, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { combineLatest } from 'rxjs';
import { COMMUNITY_LEADERS, CommunityLeader } from '../core/community-leaders';
import { CommunityApiService } from '../core/community-api.service';
import { managedLeaders } from '../core/managed-content';

@Component({
  selector: 'app-leader-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideArrowLeft, LucideArrowRight, LucideBookOpen, LucideChevronLeft, LucideChevronRight],
  templateUrl: './leader-detail.component.html',
  styleUrls: ['./public-page.css', './leader-detail.component.css']
})
export class LeaderDetailComponent implements OnInit {
  leaders: readonly CommunityLeader[] = COMMUNITY_LEADERS;
  leader?: CommunityLeader;
  selectedArticle = 0;

  constructor(private route: ActivatedRoute, private router: Router, private api: CommunityApiService) {}

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap, this.api.publicManagedContent()]).subscribe(([params, query, items]) => {
      this.leaders = managedLeaders(items);
      this.leader = this.leaders.find((item) => item.id === params.get('leaderId'));
      if (!this.leader) this.router.navigateByUrl('/leaders');
      const requestedArticle = Number(query.get('article') || 0);
      this.selectedArticle = Number.isInteger(requestedArticle)
        ? Math.min(Math.max(requestedArticle, 0), Math.max((this.leader?.articles.length || 1) - 1, 0))
        : 0;
      if (query.has('article')) {
        setTimeout(() => document.getElementById('profile-blogs')?.scrollIntoView({ behavior: 'smooth' }), 80);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  move(direction: number): void {
    if (!this.leader) return;
    const index = this.leaders.findIndex((item) => item.id === this.leader?.id);
    const next = this.leaders[(index + direction + this.leaders.length) % this.leaders.length];
    this.router.navigate(['/leaders', next.id]);
  }
}
