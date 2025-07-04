import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../../app/auth/services/auth.service';
import { environment } from '../../environments/environment';
import { error } from 'console';

const BACKEND_BASE_URL = environment.backendApiUrl;
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const isAuthenticated = this.authService.isAuthenticated();
    const isApiUrl = request.url.startsWith(`${BACKEND_BASE_URL}/api/admin`);

    if (isAuthenticated && token && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) =>{
        if(error.status ===401){
          console.error('Sessão invalida no servidor');
          this.authService.logout()
        }
        return throwError(() => error);
      })
    )
  }
}
