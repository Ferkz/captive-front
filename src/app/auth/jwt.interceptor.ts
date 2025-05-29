import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../app/auth/services/auth.service';
import { environment } from '../../environments/environment';

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

    return next.handle(request);
  }
}
