import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';
  loading = false;
  message = '';
  loginForm = { email: '', password: '' };
  registerForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    inviteCode: '',
    idProofUrl: '',
    professionalGroup: 'COMMUNITY' as const
  };

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    this.loading = true;
    this.message = '';
    this.auth.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: () => this.router.navigateByUrl('/feed'),
      error: (error) => {
        this.message = error.error?.message || error.error?.detail || 'Login failed';
        this.loading = false;
      }
    });
  }

  register(): void {
    this.loading = true;
    this.message = '';
    this.auth.register(this.registerForm).subscribe({
      next: () => {
        this.message = 'Registration verified. You can log in now.';
        this.mode = 'login';
        this.loading = false;
      },
      error: (error) => {
        this.message = error.error?.message || error.error?.detail || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
