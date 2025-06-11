import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, AuthRequest } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/administrator/dashboard']);
    }
  }

  get f() { return this.loginForm.controls; }
  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = "Por favor, preencha o email e a senha.";
      return;
    }
    this.isLoading = true;
    const credentials: AuthRequest = this.loginForm.value;
    this.authService.login(credentials)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/administrator/dashboard']);
          this.snackBar.open('Login realizado com sucesso!', 'OK', { duration: 3000 });
        },
        error: (err: Error) => {
          this.isLoading = false;
          this.errorMessage = 'Falha no login. Verifique suas credenciais.';
          this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
