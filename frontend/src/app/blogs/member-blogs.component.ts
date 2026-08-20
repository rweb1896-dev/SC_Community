import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideBookOpen, LucideMic, LucideMicOff, LucidePenLine, LucideX } from '@lucide/angular';
import { CommunityApiService } from '../core/community-api.service';
import { MemberBlog } from '../core/models';
import { I18nService } from '../core/i18n.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-member-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideBookOpen, LucideMic, LucideMicOff, LucidePenLine, LucideX],
  templateUrl: './member-blogs.component.html',
  styleUrl: './member-blogs.component.css'
})
export class MemberBlogsComponent implements OnInit, OnDestroy {
  blogs: MemberBlog[] = [];
  tab: 'ALL' | 'MINE' = 'ALL';
  loading = true;
  saving = false;
  composerOpen = false;
  editingId?: number;
  error = '';
  voiceSupported = false;
  listening = false;
  form = { title: '', body: '', imageUrl: '' };
  private recognition?: any;
  private readonly subscriptions = new Subscription();

  constructor(private api: CommunityApiService, private i18n: I18nService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.voiceSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    this.subscriptions.add(this.route.queryParamMap.subscribe((params) => {
      this.load(params.get('tab') === 'mine' ? 'MINE' : 'ALL');
    }));
  }
  ngOnDestroy(): void { this.recognition?.stop(); this.subscriptions.unsubscribe(); }

  load(tab = this.tab): void {
    this.tab = tab; this.loading = true; this.error = '';
    this.api.blogs(tab === 'MINE').subscribe({
      next: blogs => { this.blogs = blogs; this.loading = false; },
      error: error => { this.error = error.error?.detail || 'Blogs could not be loaded.'; this.loading = false; }
    });
  }

  selectTab(tab: 'ALL' | 'MINE'): void {
    const requested = tab === 'MINE' ? 'mine' : null;
    if ((this.route.snapshot.queryParamMap.get('tab') || null) === requested) {
      this.load(tab);
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: requested }, queryParamsHandling: 'merge' });
  }

  openComposer(blog?: MemberBlog): void {
    this.error = ''; this.editingId = blog?.id;
    this.form = blog ? { title: blog.title, body: blog.body, imageUrl: blog.imageUrl || '' } : { title: '', body: '', imageUrl: '' };
    this.composerOpen = true;
  }

  closeComposer(): void { if (!this.saving) { this.stopVoice(); this.composerOpen = false; } }

  save(): void {
    if (this.saving || !this.form.title.trim() || !this.form.body.trim()) return;
    this.saving = true; this.error = '';
    const request = this.editingId
      ? this.api.updateBlog(this.editingId, this.form.title.trim(), this.form.body.trim(), this.form.imageUrl.trim())
      : this.api.createBlog(this.form.title.trim(), this.form.body.trim(), this.form.imageUrl.trim());
    request.subscribe({
      next: () => { this.saving = false; this.composerOpen = false; this.editingId = undefined; this.load(this.tab); },
      error: error => { this.saving = false; this.error = error.error?.detail || 'Blog could not be saved.'; }
    });
  }

  delete(blog: MemberBlog): void {
    if (!confirm(`Delete “${blog.title}”?`)) return;
    this.api.deleteBlog(blog.id).subscribe({ next: () => this.load(this.tab), error: error => this.error = error.error?.detail || 'Blog could not be deleted.' });
  }

  toggleVoice(): void {
    if (this.listening) { this.stopVoice(); return; }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { this.error = 'Voice typing is not supported in this browser.'; return; }
    const recognition = new Recognition();
    recognition.lang = this.i18n.language() === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = true; recognition.interimResults = false;
    recognition.onstart = () => this.listening = true;
    recognition.onresult = (event: any) => {
      let spoken = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) spoken += `${event.results[index][0].transcript} `;
      if (spoken) this.form.body = `${this.form.body}${this.form.body ? ' ' : ''}${spoken.trim()}`;
    };
    recognition.onerror = () => { this.listening = false; this.error = 'Voice input stopped. You can keep writing normally.'; };
    recognition.onend = () => this.listening = false;
    this.recognition = recognition; recognition.start();
  }
  private stopVoice(): void { this.recognition?.stop(); this.recognition = undefined; this.listening = false; }
}
