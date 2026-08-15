import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideBriefcaseBusiness, LucideLockKeyhole, LucideUsersRound } from '@lucide/angular';
import { CommunityApiService } from '../core/community-api.service';
import { PublicMemberProfile } from '../core/models';

@Component({
  selector: 'app-public-member-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideBriefcaseBusiness, LucideLockKeyhole, LucideUsersRound],
  templateUrl: './public-member-profile.component.html',
  styleUrl: './public-member-profile.component.css'
})
export class PublicMemberProfileComponent implements OnInit {
  member?: PublicMemberProfile;
  loading = true;
  unavailable = false;

  constructor(private route: ActivatedRoute, private api: CommunityApiService) { }
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    if (!Number.isSafeInteger(id) || id < 1) { this.loading = false; this.unavailable = true; return; }
    this.api.publicMemberProfile(id).subscribe({
      next: member => { this.member = member; this.loading = false; },
      error: () => { this.unavailable = true; this.loading = false; }
    });
  }
  label(value?: string): string { return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) : ''; }
}
