import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideBookOpen, LucideBriefcaseBusiness, LucideChevronLeft, LucideChevronRight, LucideEllipsis, LucideHeartPulse, LucideHouse, LucideMessageCircle, LucideMic, LucideMicOff, LucideShare2, LucideShieldCheck, LucideSiren, LucideSquarePen, LucideStore, LucideThumbsUp, LucideUsersRound } from '@lucide/angular';
import { auditTime, interval, Subscription } from 'rxjs';
import { Category, Comment, ImageUploadResponse, Post, UserResponse } from '../core/models';
import { CommunityApiService } from '../core/community-api.service';
import { AuthService } from '../core/auth.service';
import { COMMUNITY_LEADERS } from '../core/community-leaders';
import { managedLeaders } from '../core/managed-content';
import { FeedSocketService } from '../core/feed-socket.service';
import { I18nService } from '../core/i18n.service';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LucideBookOpen, LucideBriefcaseBusiness, LucideChevronLeft, LucideChevronRight, LucideEllipsis, LucideHeartPulse, LucideHouse, LucideMessageCircle, LucideMic, LucideMicOff, LucideShare2, LucideShieldCheck, LucideSiren, LucideSquarePen, LucideStore, LucideThumbsUp, LucideUsersRound],
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
  commentErrors: Record<number, string> = {};
  commentSubmitting = new Set<number>();
  supporting = new Set<number>();
  error = '';
  loadingCategories = true;
  loadingPosts = true;
  posting = false;
  uploadProgress = 0;
  imageMode: 'UPLOAD' | 'URL' = 'UPLOAD';
  imageFile?: File;
  imagePreview = '';
  composerError = '';
  composerSuccess = '';
  discardConfirm = false;
  speechLanguage: 'en-IN' | 'hi-IN' = 'en-IN';
  speechSupported = false;
  isListening = false;
  speechInterim = '';
  speechError = '';
  composerOpen = false;
  showScrollTop = false;
  searchTerm = '';
  activeLeaderIndex = 0;
  leaders = [...COMMUNITY_LEADERS];
  private leaderTimer?: ReturnType<typeof setInterval>;
  private readonly subscriptions = new Subscription();
  private speechRecognition?: any;

  get activeLeader() {
    return this.leaders[this.activeLeaderIndex] || COMMUNITY_LEADERS[0];
  }

  get visiblePosts(): Post[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.posts;
    return this.posts.filter((post) => `${post.authorName} ${post.categoryName} ${post.content}`.toLowerCase().includes(query));
  }

  get visibleMembers(): UserResponse[] {
    const query = this.searchTerm.trim().toLowerCase();
    return (query ? this.members.filter((member) => `${member.fullName} ${member.email}`.toLowerCase().includes(query)) : this.members).slice(0, 4);
  }

  constructor(
    private api: CommunityApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private feedSocket: FeedSocketService,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    document.body.classList.add('feed-lock');
    this.speechSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    this.speechLanguage = this.i18n.language() === 'hi' ? 'hi-IN' : 'en-IN';
    this.subscriptions.add(this.route.queryParamMap.subscribe((params) => this.searchTerm = params.get('q') || ''));
    this.api.categories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.postForm.categoryId = categories[0]?.id || 0;
        this.loadingCategories = false;
      },
      error: (error) => {
        this.error = this.apiError(error, this.i18n.t('feed.loadError'));
        this.loadingCategories = false;
      }
    });
    this.api.verifiedUsers().subscribe({ next: (members) => this.members = members, error: () => this.members = [] });
    this.api.publicManagedContent().subscribe({ next: (items) => {
      const available = managedLeaders(items);
      this.leaders = available.length ? available : [...COMMUNITY_LEADERS];
      this.activeLeaderIndex = 0;
    }});
    this.loadPosts();
    this.feedSocket.connect();
    this.subscriptions.add(this.feedSocket.updates$.pipe(auditTime(350)).subscribe(() => this.loadPosts(this.selectedCategory, true)));
    this.subscriptions.add(interval(15000).subscribe(() => this.loadPosts(this.selectedCategory, true)));
    this.leaderTimer = setInterval(() => this.rotateLeader(1), 6500);
  }

  loadPosts(categoryId?: number, background = false): void {
    this.selectedCategory = categoryId;
    if (!background) this.loadingPosts = true;
    this.api.posts(categoryId).subscribe({
      next: (posts) => { this.posts = posts; this.loadingPosts = false; this.error = ''; },
      error: (error) => { this.error = this.apiError(error, this.i18n.t('feed.loadError')); this.loadingPosts = false; }
    });
  }

  createPost(): void {
    this.composerError = '';
    if (this.posting || !this.postForm.categoryId || !this.postForm.content.trim()) return;
    if (this.postForm.content.trim().length > 3000) {
      this.composerError = 'Post text cannot exceed 3000 characters.';
      return;
    }
    this.posting = true;
    if (!this.imageFile) {
      this.submitPost(this.postForm.imageUrl.trim());
      return;
    }
    this.api.uploadPostImage(this.imageFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
        }
        if (event instanceof HttpResponse) this.submitPost((event.body as ImageUploadResponse | null)?.imageUrl || '');
      },
      error: (error) => { this.posting = false; this.uploadProgress = 0; this.composerError = this.apiError(error, 'Image upload failed. Please try again.'); }
    });
  }

  openComposer(categoryId?: number): void {
    const preferredCategory = categoryId || this.selectedCategory;
    this.postForm.categoryId = preferredCategory || this.postForm.categoryId || this.categories[0]?.id || 0;
    this.composerError = '';
    this.discardConfirm = false;
    this.composerOpen = true;
  }

  closeComposer(): void {
    if (this.posting) return;
    if (this.isListening) this.stopVoiceInput();
    if (this.hasDraft()) { this.discardConfirm = true; return; }
    this.composerOpen = false;
  }

  keepEditing(): void { this.discardConfirm = false; }

  discardDraft(): void {
    this.cancelVoiceInput();
    this.resetComposer();
    this.discardConfirm = false;
    this.composerOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.composerOpen) this.closeComposer(); }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.composerError = 'Only JPG and PNG images are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.composerError = 'Image size must be 5 MB or less.';
      return;
    }
    this.revokePreview();
    this.imageFile = file;
    this.imagePreview = URL.createObjectURL(file);
    this.postForm.imageUrl = '';
    this.composerError = '';
  }

  startVoiceInput(): void {
    if (this.isListening) { this.stopVoiceInput(); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.speechError = this.i18n.t('feed.voiceUnsupported');
      return;
    }

    this.speechError = '';
    this.speechInterim = '';
    const recognition = new SpeechRecognition();
    recognition.lang = this.speechLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => this.isListening = true;
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript?.trim() || '';
        if (event.results[index].isFinal) finalText += `${transcript} `;
        else interimText += `${transcript} `;
      }
      if (finalText.trim()) {
        const separator = this.postForm.content.trim() ? ' ' : '';
        this.postForm.content = `${this.postForm.content.trimEnd()}${separator}${finalText.trim()}`.slice(0, 3000);
      }
      this.speechInterim = interimText.trim();
    };
    recognition.onerror = (event: any) => {
      this.isListening = false;
      this.speechInterim = '';
      if (this.speechRecognition === recognition) this.speechRecognition = undefined;
      const key = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'feed.voicePermission'
        : event.error === 'no-speech' ? 'feed.voiceNoSpeech' : 'feed.voiceError';
      this.speechError = this.i18n.t(key);
    };
    recognition.onend = () => {
      if (this.speechRecognition === recognition) this.speechRecognition = undefined;
      this.isListening = false;
      this.speechInterim = '';
    };
    this.speechRecognition = recognition;
    try { recognition.start(); }
    catch { this.speechError = this.i18n.t('feed.voiceError'); }
  }

  stopVoiceInput(): void {
    if (this.speechRecognition) {
      this.speechRecognition.onend = null;
      this.speechRecognition.stop();
      this.speechRecognition = undefined;
    }
    this.isListening = false;
    this.speechInterim = '';
  }

  changeSpeechLanguage(language: 'en-IN' | 'hi-IN'): void {
    if (this.isListening) this.stopVoiceInput();
    this.speechLanguage = language;
    this.speechError = '';
  }

  updateUrlPreview(): void {
    this.imageFile = undefined;
    this.revokePreview();
    this.imagePreview = /^https:\/\//i.test(this.postForm.imageUrl.trim()) ? this.postForm.imageUrl.trim() : '';
  }

  setImageMode(mode: 'UPLOAD' | 'URL'): void {
    this.imageMode = mode;
    this.removeImage();
  }

  removeImage(): void {
    this.revokePreview();
    this.imageFile = undefined;
    this.imagePreview = '';
    this.postForm.imageUrl = '';
    this.uploadProgress = 0;
  }

  onFeedScroll(): void {
    const element = this.feedScroller?.nativeElement;
    if (!element) return;
    const scrollable = element.scrollHeight - element.clientHeight;
    this.showScrollTop = element.scrollTop > 480;
    this.scrollProgress = scrollable > 0 ? Math.min(100, Math.round((element.scrollTop / scrollable) * 100)) : 0;
  }

  scrollToTop(): void { this.feedScroller?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' }); }

  ngOnDestroy(): void {
    document.body.classList.remove('feed-lock');
    if (this.leaderTimer) clearInterval(this.leaderTimer);
    this.subscriptions.unsubscribe();
    this.feedSocket.disconnect();
    this.cancelVoiceInput();
    this.revokePreview();
  }

  rotateLeader(direction: number): void {
    if (!this.leaders.length) return;
    this.activeLeaderIndex = (this.activeLeaderIndex + direction + this.leaders.length) % this.leaders.length;
  }

  toggleComments(postId: number): void {
    if (this.comments[postId]) { delete this.comments[postId]; return; }
    this.commentErrors[postId] = '';
    this.api.comments(postId).subscribe({
      next: (comments) => this.comments[postId] = comments,
      error: (error) => this.commentErrors[postId] = this.apiError(error, 'Comments could not be loaded.')
    });
  }

  addComment(post: Post): void {
    const draft = this.commentDrafts[post.id]?.trim();
    if (!draft || this.commentSubmitting.has(post.id)) return;
    this.commentSubmitting.add(post.id);
    this.commentErrors[post.id] = '';
    this.api.addComment(post.id, draft).subscribe({
      next: (comment) => {
        this.comments[post.id] = [...(this.comments[post.id] || []), comment];
        this.commentDrafts[post.id] = '';
        post.commentCount += 1;
        this.commentSubmitting.delete(post.id);
      },
      error: (error) => { this.commentErrors[post.id] = this.apiError(error, 'Comment could not be sent.'); this.commentSubmitting.delete(post.id); }
    });
  }

  toggleSupport(post: Post): void {
    if (this.supporting.has(post.id)) return;
    this.supporting.add(post.id);
    this.api.toggleSupport(post.id).subscribe({
      next: (result) => { post.supportCount = result.supportCount; post.supportedByCurrentUser = result.supported; this.supporting.delete(post.id); },
      error: (error) => { this.error = this.apiError(error, 'Support could not be updated.'); this.supporting.delete(post.id); }
    });
  }

  async sharePost(post: Post): Promise<void> {
    const url = `${location.origin}/feed?post=${post.id}`;
    const data = { title: `${post.authorName} — Community Connect`, text: post.content, url };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(`${data.text}\n${url}`);
    } catch { /* The user may cancel the native share sheet. */ }
  }

  currentInitials(): string {
    const name = this.auth.session?.fullName || 'Community Member';
    return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase(); }

  categoryIcon(name: string): string {
    if (name.toLowerCase().includes('health')) return 'H';
    if (name.toLowerCase().includes('job')) return 'J';
    if (name.toLowerCase().includes('business')) return 'B';
    return 'S';
  }

  categoryKey(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized.includes('health')) return 'healthHelp';
    if (normalized.includes('job')) return 'jobUpdates';
    if (normalized.includes('business')) return 'businessGrowth';
    if (normalized.includes('education')) return 'education';
    if (normalized.includes('community')) return 'community';
    return 'openForum';
  }

  categoryLabel(name: string): string { return this.i18n.t(`category.${this.categoryKey(name)}`); }

  selectedCategoryName(): string {
    const category = this.categories.find((item) => item.id === this.selectedCategory);
    return category ? this.categoryLabel(category.name) : this.i18n.t('feed.all');
  }

  private submitPost(imageUrl: string): void {
    this.stopVoiceInput();
    this.api.createPost(this.postForm.categoryId, this.postForm.content.trim(), imageUrl).subscribe({
      next: () => {
        this.posting = false;
        this.composerSuccess = this.i18n.t('feed.posted');
        this.resetComposer();
        this.composerOpen = false;
        this.loadPosts(this.selectedCategory, true);
        window.setTimeout(() => this.composerSuccess = '', 4000);
      },
      error: (error) => { this.posting = false; this.uploadProgress = 0; this.composerError = this.apiError(error, 'Post could not be created.'); }
    });
  }

  private hasDraft(): boolean { return !!(this.postForm.content.trim() || this.imageFile || this.postForm.imageUrl.trim()); }

  private resetComposer(): void {
    this.cancelVoiceInput();
    this.revokePreview();
    this.postForm.content = '';
    this.postForm.imageUrl = '';
    this.imageFile = undefined;
    this.imagePreview = '';
    this.uploadProgress = 0;
    this.composerError = '';
    this.speechError = '';
    this.speechInterim = '';
  }

  private revokePreview(): void {
    if (this.imagePreview.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
  }

  private cancelVoiceInput(): void {
    if (this.speechRecognition) {
      this.speechRecognition.onresult = null;
      this.speechRecognition.onerror = null;
      this.speechRecognition.onend = null;
      this.speechRecognition.abort();
      this.speechRecognition = undefined;
    }
    this.isListening = false;
    this.speechInterim = '';
  }

  private apiError(error: any, fallback: string): string {
    if (error?.status === 0) return 'Network connection unavailable. Please check your internet and try again.';
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
