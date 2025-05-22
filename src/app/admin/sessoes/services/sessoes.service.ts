import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Session, SessionPatchData, BackendSessionResponse } from '../interfaces/session';

const SESSION_API_BASE_URL = 'http://localhost:8080/api/admin/sessions';

@Injectable({
  providedIn: 'root'
})
export class SessoesService {

  constructor(private http: HttpClient) { }
  getSessions(): Observable<Session[]>{
    return this.http.get<BackendSessionResponse<Session[]>>(SESSION_API_BASE_URL)
    .pipe(
      map(response => response.payload || []), //extrai o payload e garante array
      catchError(this.handleError)
    );
  }
  getSessionById(id: number): Observable<Session>{
    return this.http.get<BackendSessionResponse<Session>>(`${SESSION_API_BASE_URL}/${id}`)
    .pipe(
      map(response => response.payload),
      catchError(this.handleError)
    )
  }
  deleteSession(id: number): Observable<boolean> {
    return this.http.delete<BackendSessionResponse<boolean>>(`${SESSION_API_BASE_URL}/${id}`)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }
  getValidSessions(): Observable<Session[]> {
    return this.http.get<BackendSessionResponse<Session[]>>(`${SESSION_API_BASE_URL}/valid`)
      .pipe(
        map(response => response.payload || []),
        catchError(this.handleError)
      );
  }
  getExpiredSessions(): Observable<Session[]> {
    return this.http.get<BackendSessionResponse<Session[]>>(`${SESSION_API_BASE_URL}/expired`)
      .pipe(
        map(response => response.payload || []),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao gerenciar sessões.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      if (error.error && error.error.errorDescription) {
        errorMessage = `${error.error.responseDescription || 'Erro'}: ${error.error.errorDescription}`;
      } else if (error.statusText && error.status !== 0) {
        errorMessage = `Erro ${error.status}: ${error.statusText}`;
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão ou a disponibilidade do backend.';
      }
    }
    console.error('Erro no SessoesService:', error, 'Mensagem:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
