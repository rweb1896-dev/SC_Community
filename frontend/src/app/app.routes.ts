import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((module) => module.LoginComponent)
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
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  { path: '**', redirectTo: 'feed' }
];
