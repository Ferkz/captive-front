import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Logs, BackendAccessLogResponse } from '../interfaces/logs';

const ACCESS_LOG_API_BASE_URL = 'http://localhost:8080/api/admin/accessLogs'; // Endpoint do AccessLogController

@Injectable({
  providedIn: 'root'
})
export class AccessLogService {

  constructor(private http: HttpClient) { }

  // O backend atual GET /api/admin/accessLogs retorna todos, mas aceita params de paginação
  getAccessLogs(page: number = 0, size: number = 50, paging: boolean = false): Observable<Logs[]> {
    let params = new HttpParams()
      .set('paging', paging.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<BackendAccessLogResponse<Logs[]>>(ACCESS_LOG_API_BASE_URL, { params })
      .pipe(
        map(response => response.payload || []),
        catchError(this.handleError)
      );
  }

  getAccessLogById(id: number): Observable<Logs> {
    return this.http.get<BackendAccessLogResponse<Logs>>(`${ACCESS_LOG_API_BASE_URL}/${id}`)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }

  deleteAccessLog(id: number): Observable<boolean> {
    return this.http.delete<BackendAccessLogResponse<boolean>>(`${ACCESS_LOG_API_BASE_URL}/${id}`)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao gerenciar logs de acesso.';
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
    console.error('Erro no AccessLogService:', error, 'Mensagem:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
