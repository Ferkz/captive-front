import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

const AUTH_API_URL = 'http://10.0.0.71:8080/api/authenticate';
const TOKEN_KEY = 'adminAuthToken';

export interface AuthRequest {
  username?: string;
  password?: string;
}
export interface AuthResponse {
  token?: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  constructor( private http: HttpClient, private router: Router) { }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
  private hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
  login(credentials: AuthRequest): Observable<AuthResponse>{
    return this.http.post<AuthResponse>(AUTH_API_URL, credentials).pipe(
      tap(response =>{
        if (response && response.token){
          localStorage.setItem(TOKEN_KEY, response.token)
          this.loggedIn.next(true);
          console.log('Admini token stored. Acessando area admin');
          this.router.navigate(['/dashboard'])
        }
      }),
      catchError(this.handleError)
    );
  }
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.loggedIn.next(false);
    this.router.navigate(['/auth/admin/login']);
    console.log('Admin logged out');
  }
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }
  isAuthenticated(): boolean {
    const token = this.getToken();
    if(!token){
      return false;
    }
    return true;
  }
    private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Falha na autenticação.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      console.error(
        `Erro do backend ${error.status}, ` +
        `Corpo: ${JSON.stringify(error.error)}`);
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Usuário ou senha inválidos.';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string' && error.error.length > 0 && error.error.length < 200) {
        errorMessage = error.error;
      } else {
        errorMessage = `Erro ${error.status}: Não foi possível conectar ao servidor de autenticação.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
