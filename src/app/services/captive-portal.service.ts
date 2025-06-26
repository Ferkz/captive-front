import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const BACKEND_BASE_URL = environment.backendApiUrl;

export interface CaptiveLoginRequest {
  username?: string;
  password?: string;
  mac: string;
  ap?: string;
  ssid?: string;
}

export interface GuestRegistrationRequest {
  fullName: string;
  email: string;
  cpf: string;
  phoneNumber: string;
  deviceMac: string;
  deviceIp?: string;
  accessPointMac?: string;
  browser?: string;
  operatingSystem?: string;
  acceptTou: boolean;
}
export interface GuestLoginRequest {
  cpf: string;
  deviceMac: string;
  accessPointMac?: string;
}

export interface BackendPortalResponse {
  response?: number;
  description?: string;
  payload?: any;
  errorDescription?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CaptivePortalService {
  private captivePortalLoginUrl = `${BACKEND_BASE_URL}/captive/portal/login`;
  private captivePortalLogoutUrl = `${BACKEND_BASE_URL}/captive/portal/logout`;
  private guestRegisterUrl = `${BACKEND_BASE_URL}/portal/guest/register-and-authorize`;
  private guestLoginUrl = `${BACKEND_BASE_URL}/portal/guest/login`;

  constructor(private http: HttpClient) {}

  /**
   * @param loginData
   * @returns
   */
  login(loginData: CaptiveLoginRequest): Observable<BackendPortalResponse> {
    return this.http
      .post<BackendPortalResponse>(this.captivePortalLoginUrl, loginData)
      .pipe(
        tap((response) =>
          console.log(
            'Resposta do login do portal (username/password):',
            response
          )
        ),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * @param registrationData Dados do registro do convidado.
   * @returns Observable da resposta do backend.
   */
  registerGuest(
    registrationData: GuestRegistrationRequest
  ): Observable<BackendPortalResponse> {
    return this.http
      .post<BackendPortalResponse>(this.guestRegisterUrl, registrationData)
      .pipe(
        tap((response) =>
          console.log('Resposta do registro de convidado:', response)
        ),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * @param loginData
   * @returns
   */
  guestLogin(loginData: GuestLoginRequest): Observable<BackendPortalResponse> {
    return this.http
      .post<BackendPortalResponse>(this.guestLoginUrl, loginData)
      .pipe(
        tap((response) =>
          console.log('Resposta do login de convidado (cpf/mac):', response)
        ),
       catchError((errorDescription) => {
         console.error('ERRO CAPTURADO no pipe do guestLogin:', errorDescription);
         return this.handleError(errorDescription);
       })
      );
  }
  /**
   * @param macAddress
   * @returns
   */
  logout(macAddress: string): Observable<BackendPortalResponse> {
    const body = { mac: macAddress };
    return this.http
      .post<BackendPortalResponse>(this.captivePortalLogoutUrl, body)
      .pipe(
        tap((response) => console.log('Resposta do logout do portal:', response)
        ),
         catchError((err) => {
         console.error('ERRO CAPTURADO no pipe do guestLogin:', err);
         return this.handleError(err);
       })
      );
  }
   private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('A função handleError recebeu o seguinte erro:', error);
    const errorMessage = error.error?.payload || error.error?.description || 'Ocorreu uma falha. Por favor, tente novamente.';
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }
}
