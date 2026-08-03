import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: 'community',
    loadComponent: () => import('./public/community-home.component').then((module) => module.CommunityHomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((module) => module.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'leaders',
    loadComponent: () => import('./public/leaders.component').then((module) => module.LeadersComponent)
  },
  {
    path: 'leaders/:leaderId',
    loadComponent: () => import('./public/leader-detail.component').then((module) => module.LeaderDetailComponent)
  },
  {
    path: 'library',
    loadComponent: () => import('./public/library.component').then((module) => module.LibraryComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./public/events.component').then((module) => module.EventsComponent)
  },
  {
    path: 'live',
    loadComponent: () => import('./public/live.component').then((module) => module.LiveComponent)
  },
  {
    path: 'feed',
    loadComponent: () => import('./feed/feed.component').then((module) => module.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.component').then((module) => module.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'meetings',
    loadComponent: () => import('./meetings/meetings.component').then((module) => module.MeetingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'meetings/:meetingId',
    loadComponent: () => import('./meetings/meeting-room.component').then((module) => module.MeetingRoomComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then((module) => module.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '', pathMatch: 'full', redirectTo: 'community' },
  { path: '**', redirectTo: 'community' }
];
