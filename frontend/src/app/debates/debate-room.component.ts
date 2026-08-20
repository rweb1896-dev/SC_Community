import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideLockKeyhole, LucideMessageCircle, LucideMessagesSquare, LucidePenLine, LucideX } from '@lucide/angular';
import { CommunityApiService } from '../core/community-api.service';
import { DebateComment, DebateTopic } from '../core/models';

@Component({
  selector: 'app-debate-room',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideLockKeyhole, LucideMessageCircle, LucideMessagesSquare, LucidePenLine, LucideX],
  templateUrl: './debate-room.component.html',
  styleUrl: './debate-room.component.css'
})
export class DebateRoomComponent implements OnInit {
  topics: DebateTopic[] = [];
  loading = true;
  error = '';
  composerOpen = false;
  saving = false;
  editingId?: number;
  openedTopicId?: number;
  comments: Record<number, DebateComment[]> = {};
  commentDraft: Record<number, string> = {};
  commentSending = new Set<number>();
  form = { title: '', body: '', imageUrl: '' };

  constructor(private api: CommunityApiService) { }
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = '';
    this.api.debates().subscribe({
      next: topics => { this.topics = topics; this.loading = false; },
      error: error => { this.error = error.error?.detail || 'Debate room could not be loaded.'; this.loading = false; }
    });
  }

  openComposer(topic?: DebateTopic): void {
    this.editingId = topic?.id; this.error = '';
    this.form = topic ? { title: topic.title, body: topic.body, imageUrl: topic.imageUrl || '' } : { title: '', body: '', imageUrl: '' };
    this.composerOpen = true;
  }
  closeComposer(): void { if (!this.saving) this.composerOpen = false; }

  save(): void {
    if (this.saving || !this.form.title.trim() || !this.form.body.trim()) return;
    this.saving = true; this.error = '';
    const request = this.editingId
      ? this.api.updateDebate(this.editingId, this.form.title.trim(), this.form.body.trim(), this.form.imageUrl.trim())
      : this.api.createDebate(this.form.title.trim(), this.form.body.trim(), this.form.imageUrl.trim());
    request.subscribe({
      next: () => { this.saving = false; this.composerOpen = false; this.editingId = undefined; this.load(); },
      error: error => { this.saving = false; this.error = error.error?.detail || 'Topic could not be saved.'; }
    });
  }

  delete(topic: DebateTopic): void {
    if (!confirm(`Delete “${topic.title}”?`)) return;
    this.api.deleteDebate(topic.id).subscribe({ next: () => { if (this.openedTopicId === topic.id) this.openedTopicId = undefined; this.load(); }, error: error => this.error = error.error?.detail || 'Topic could not be deleted.' });
  }

  toggleDiscussion(topic: DebateTopic): void {
    if (this.openedTopicId === topic.id) { this.openedTopicId = undefined; return; }
    this.openedTopicId = topic.id;
    if (this.comments[topic.id]) return;
    this.api.debateComments(topic.id).subscribe({ next: comments => this.comments[topic.id] = comments, error: error => this.error = error.error?.detail || 'Discussion could not be loaded.' });
  }

  addComment(topic: DebateTopic): void {
    const message = (this.commentDraft[topic.id] || '').trim();
    if (!message || this.commentSending.has(topic.id)) return;
    this.commentSending.add(topic.id); this.error = '';
    this.api.addDebateComment(topic.id, message).subscribe({
      next: comment => {
        this.comments[topic.id] = [...(this.comments[topic.id] || []), comment];
        this.commentDraft[topic.id] = '';
        this.topics = this.topics.map(item => item.id === topic.id ? { ...item, commentCount: item.commentCount + 1 } : item);
        this.commentSending.delete(topic.id);
      },
      error: error => { this.error = error.error?.detail || 'Reply could not be sent.'; this.commentSending.delete(topic.id); }
    });
  }
}
