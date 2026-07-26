import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideBookOpen, LucideBriefcaseBusiness, LucideEllipsis, LucideHeartPulse, LucideHouse, LucideMessageCircle, LucideShare2, LucideShieldCheck, LucideSiren, LucideSquarePen, LucideStore, LucideThumbsUp, LucideUsersRound } from '@lucide/angular';
import { Category, Comment, Post, UserResponse } from '../core/models';
import { CommunityApiService } from '../core/community-api.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideBookOpen, LucideBriefcaseBusiness, LucideEllipsis, LucideHeartPulse, LucideHouse, LucideMessageCircle, LucideShare2, LucideShieldCheck, LucideSiren, LucideSquarePen, LucideStore, LucideThumbsUp, LucideUsersRound],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  @ViewChild('feedScroller') feedScroller?: ElementRef<HTMLElement>;
  scrollProgress = 0;
  categories: Category[] = [];
  posts: Post[] = [];
  members: UserResponse[] = [];
  comments: Record<number, Comment[]> = {};
  selectedCategory?: number;
  postForm = { categoryId: 0, content: '', imageUrl: '' };
  commentDrafts: Record<number, string> = {};
  error = '';
  loadingCategories = true;
  loadingPosts = true;
  composerOpen = false;
  showScrollTop = false;
  searchTerm = '';

  get visiblePosts(): Post[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.posts;
    return this.posts.filter((post) => `${post.authorName} ${post.categoryName} ${post.content}`.toLowerCase().includes(query));
  }

  get visibleMembers(): UserResponse[] {
    const query = this.searchTerm.trim().toLowerCase();
    return (query ? this.members.filter((member) => `${member.fullName} ${member.email}`.toLowerCase().includes(query)) : this.members).slice(0, 4);
  }

  constructor(private api: CommunityApiService, public auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    document.body.classList.add('feed-lock');
    this.route.queryParamMap.subscribe((params) => this.searchTerm = params.get('q') || '');
    this.api.categories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.postForm.categoryId = categories[0]?.id || 0;
        this.loadingCategories = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Categories load nahi ho pa rahi hain';
        this.loadingCategories = false;
      }
    });
    this.api.verifiedUsers().subscribe({
      next: (members) => this.members = members,
      error: () => this.members = []
    });
    this.loadPosts();
  }

  loadPosts(categoryId?: number): void {
    this.selectedCategory = categoryId;
    this.loadingPosts = true;
    this.api.posts(categoryId).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loadingPosts = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Unable to load posts';
        this.loadingPosts = false;
      }
    });
  }

  createPost(): void {
    this.api.createPost(this.postForm.categoryId, this.postForm.content, this.postForm.imageUrl).subscribe({
      next: () => {
        this.postForm.content = '';
        this.postForm.imageUrl = '';
        this.composerOpen = false;
        this.loadPosts(this.selectedCategory);
      },
      error: (error) => this.error = error.error?.detail || 'Post could not be created'
    });
  }

  openComposer(categoryId?: number): void {
    const preferredCategory = categoryId || this.selectedCategory;
    if (preferredCategory) {
      this.postForm.categoryId = preferredCategory;
    } else if (!this.postForm.categoryId && this.categories.length) {
      this.postForm.categoryId = this.categories[0].id;
    }
    this.composerOpen = true;
  }

  closeComposer(): void {
    this.composerOpen = false;
  }

  onFeedScroll(): void {
    const element = this.feedScroller?.nativeElement;
    if (!element) return;
    const scrollable = element.scrollHeight - element.clientHeight;
    this.showScrollTop = element.scrollTop > 480;
    this.scrollProgress = scrollable > 0 ? Math.min(100, Math.round((element.scrollTop / scrollable) * 100)) : 0;
  }

  scrollToTop(): void {
    this.feedScroller?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void { document.body.classList.remove('feed-lock'); }

  toggleComments(postId: number): void {
    if (this.comments[postId]) {
      delete this.comments[postId];
      return;
    }
    this.api.comments(postId).subscribe((comments) => this.comments[postId] = comments);
  }

  addComment(postId: number): void {
    const draft = this.commentDrafts[postId];
    if (!draft?.trim()) {
      return;
    }
    this.api.addComment(postId, draft).subscribe((comment) => {
      this.comments[postId] = [...(this.comments[postId] || []), comment];
      this.commentDrafts[postId] = '';
    });
  }

  currentInitials(): string {
    const name = this.auth.session?.fullName || 'Community Member';
    return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  categoryIcon(name: string): string {
    if (name.includes('Health')) return 'H';
    if (name.includes('Job')) return 'J';
    if (name.includes('Business')) return 'B';
    return 'S';
  }

  selectedCategoryName(): string {
    return this.categories.find((category) => category.id === this.selectedCategory)?.name || 'All Updates';
  }
}
