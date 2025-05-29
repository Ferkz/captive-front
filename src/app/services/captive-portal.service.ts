import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
  phoneNumber: string;
  deviceMac: string;
  deviceIp?: string;
  accessPointMac?: string;
  browser?: string;
  operatingSystem?: string;
  acceptTou: boolean;
}
export interface GuestLoginRequest {
  email: string;
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
  providedIn: 'root'
})
export class CaptivePortalService {
  private captivePortalLoginUrl = `${BACKEND_BASE_URL}/captive/portal/login`;
  private captivePortalLogoutUrl = `${BACKEND_BASE_URL}/captive/portal/logout`;
  private guestRegisterUrl = `${BACKEND_BASE_URL}/portal/guest/register-and-authorize`;
  private guestLoginUrl = `${BACKEND_BASE_URL}/portal/guest/login`;

  constructor(private http: HttpClient) { }

  /**
   * Método para o login tradicional do portal cativo (com username e password).
   * @param loginData Dados de login (username, password, mac, etc.).
   * @returns Observable da resposta do backend.
   */
  login(loginData: CaptiveLoginRequest): Observable<BackendPortalResponse> {
    let params = new HttpParams();
    if (loginData.username) {
      params = params.set('username', loginData.username);
    }
    if (loginData.password) {
      params = params.set('password', loginData.password);
    }
    params = params.set('mac', loginData.mac);

    if (loginData.ap) {
      params = params.set('ap', loginData.ap);
    }
    if (loginData.ssid) {
      params = params.set('ssid', loginData.ssid);
    }

    return this.http.post<BackendPortalResponse>(this.captivePortalLoginUrl, params)
      .pipe(
        tap(response => console.log('Resposta do login do portal (username/password):', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Método para o registro de um novo convidado.
   * Envia os dados como JSON para o backend.
   * @param registrationData Dados do registro do convidado.
   * @returns Observable da resposta do backend.
   */
  registerGuest(registrationData: GuestRegistrationRequest): Observable<BackendPortalResponse> {
    // O backend espera um @RequestBody, então enviamos o objeto JSON diretamente.
    return this.http.post<BackendPortalResponse>(this.guestRegisterUrl, registrationData)
      .pipe(
        tap(response => console.log('Resposta do registro de convidado:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Método para o login de um convidado já registrado (re-autenticação/liberação).
   * Envia os dados como JSON para o backend.
   * @param loginData Dados de login do convidado (email, mac).
   * @returns Observable da resposta do backend.
   */
  guestLogin(loginData: GuestLoginRequest): Observable<BackendPortalResponse> {
    // O backend espera um @RequestBody, então enviamos o objeto JSON diretamente.
    return this.http.post<BackendPortalResponse>(this.guestLoginUrl, loginData)
      .pipe(
        tap(response => console.log('Resposta do login de convidado (email/mac):', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Método para realizar o logout de um dispositivo do portal cativo.
   * @param macAddress Endereço MAC do dispositivo a ser desautorizado.
   * @returns Observable da resposta do backend.
   */
  logout(macAddress: string): Observable<BackendPortalResponse> {
    let params = new HttpParams().set('mac', macAddress);

    return this.http.post<BackendPortalResponse>(this.captivePortalLogoutUrl, params)
      .pipe(
        tap(response => console.log('Resposta do logout do portal:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Manipulador de erros HTTP.
   * Extrai a mensagem de erro da resposta do backend.
   * @param error O erro HTTP.
   * @returns Observable que lança o erro.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido!';
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente ou de rede
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // O backend retornou um código de resposta malsucedido.
      // O corpo do erro pode conter a mensagem real do backend.
      console.error(
        `Código do erro do backend ${error.status}, ` +
        `corpo do erro: ${JSON.stringify(error.error)}`);

      // Tentando extrair a mensagem de erro da sua estrutura ErrorResponseDTO
      if (error.error && error.error.description) { // 'description' é o responseDescription
        errorMessage = `${error.error.description}: ${error.error.payload || error.error.errorDescription || ''}`;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error; // Caso o backend retorne uma string simples de erro
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
