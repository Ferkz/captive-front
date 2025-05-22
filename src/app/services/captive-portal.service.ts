// src/app/services/captive-portal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Defina a URL base do seu backend. Idealmente, isso viria de um arquivo de ambiente.
// Exemplo: import { environment } from '../../environments/environment';
// const CAPTIVE_PORTAL_BASE_URL = environment.captivePortalBaseUrl;
// Por enquanto, vamos definir diretamente:
const CAPTIVE_PORTAL_BASE_URL = 'http://localhost:8080/captive/portal'; // Ajuste se o seu backend estiver em outro lugar

export interface CaptiveLoginRequest {
  username?: string; // No seu backend, o controller espera 'username'
  password?: string;
  mac: string;
  ap?: string;
  ssid?: string;
}

// Interface para a resposta esperada do backend (baseado no seu SuccessResponseDTO e ErrorResponseDTO)
export interface BackendPortalResponse {
  responseId?: number; // Do GenericResponseDTO
  responseDescription?: string; // Do GenericResponseDTO
  payload?: any; // Do SuccessResponseDTO (pode conter o objeto com message, mac_address, etc.)
  errorDescription?: string; // Do ErrorResponseDTO
}


@Injectable({
  providedIn: 'root'
})
export class CaptivePortalService {
  private portalLoginUrl = `${CAPTIVE_PORTAL_BASE_URL}/login`;
  private portalLogoutUrl = `${CAPTIVE_PORTAL_BASE_URL}/logout`; // Endpoint de logout

  constructor(private http: HttpClient) { }

  login(loginData: CaptiveLoginRequest): Observable<BackendPortalResponse> {
    // O backend CaptivePortalController espera os dados como @RequestParam,
    // o que se traduz em 'application/x-www-form-urlencoded' para POST.
    // HttpParams constrói corretamente essa query string para o corpo.
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

    // Para POST com x-www-form-urlencoded, o corpo são os params e o header Content-Type é definido automaticamente
    // pelo Angular quando o segundo argumento do post() é HttpParams.
    return this.http.post<BackendPortalResponse>(this.portalLoginUrl, params)
      .pipe(
        tap(response => console.log('Resposta do login do portal:', response)),
        catchError(this.handleError)
      );
  }

  logout(macAddress: string): Observable<BackendPortalResponse> {
    let params = new HttpParams().set('mac', macAddress);

    return this.http.post<BackendPortalResponse>(this.portalLogoutUrl, params)
      .pipe(
        tap(response => console.log('Resposta do logout do portal:', response)),
        catchError(this.handleError)
      );
  }

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
      if (error.error && error.error.errorDescription) {
          errorMessage = `${error.error.responseDescription || 'Erro'}: ${error.error.errorDescription}`;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error; // Caso o backend retorne uma string simples de erro
      }
       else {
          errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
