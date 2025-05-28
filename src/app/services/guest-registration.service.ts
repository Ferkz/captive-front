import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const GUEST_PORTAL_BASE_URL = 'http://localhost:8080/portal/guest';

export interface GuestRegistrationData{
  fullName: string,
  email: string;
  phoneNumber: string;
  acceptTou: boolean;
  deviceMac?: string;
  deviceIp?: string;
  accessPointMac?: string;
  browser?: string;
  operatingSystem?: string;
}

export interface GuestRegistrationResponse {
  responseId?: number;
  responseDescription?: string;
  payload?: any;
  errorDescription?: string;
}
@Injectable({
  providedIn: 'root'
})
export class GuestRegistrationService {
  private registrationUrl = `${GUEST_PORTAL_BASE_URL}/register-and-authorize`;

  constructor(private http: HttpClient) { }

  registerAndAuthorize(data: GuestRegistrationData, queryParams?: { mac?: string, ap?: string }): Observable<GuestRegistrationResponse> {
    return this.http.post<GuestRegistrationResponse>(this.registrationUrl, data)
    .pipe(
      tap(response => console.log('Resposta do cadastro e autorização', response)),
      catchError(this.handleError)
    );
  }
 private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido durante o cadastro!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      console.error(
        `Erro do backend ${error.status}, ` +
        `Corpo do erro: ${JSON.stringify(error.error)}`);
      if (error.error && error.error.errorDescription) {
          errorMessage = `${error.error.responseDescription || 'Erro no Cadastro'}: ${error.error.errorDescription}`;
      } else if (error.error && error.error.message && typeof error.error.message === 'string' && error.error.message.includes("Validation Error")) {
          errorMessage = error.error.errorDescription || error.error.message;
      }
      else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      }
       else {
          errorMessage = `Erro ${error.status}: Falha ao conectar com o servidor.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
