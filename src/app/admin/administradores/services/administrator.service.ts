import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Administrator, AdministratorAddRequest, BackendAdminResponse } from '../interfaces/administrator';
import { environment } from 'src/environments/environment';

const ADMIN_API_BASE_URL = `${environment.backendApiUrl}/api/admin/administrators`;

@Injectable({
  providedIn: 'root'
})
export class AdministratorService {

  constructor(private http: HttpClient) { }

  getAdministrators(): Observable<Administrator[]> {
    return this.http.get<BackendAdminResponse<Administrator[]>>(ADMIN_API_BASE_URL)
      .pipe(
        map(response => response.payload || []),
        catchError(this.handleError)
      );
  }

  getAdministratorById(id: number): Observable<Administrator> {
    return this.http.get<BackendAdminResponse<Administrator>>(`${ADMIN_API_BASE_URL}/${id}`)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }
   /**
   * @param admin
   * @returns
   */
  addAdministrator(admin: AdministratorAddRequest): Observable<Administrator> {
    return this.http.post<BackendAdminResponse<Administrator>>(ADMIN_API_BASE_URL, admin)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }
  updateAdministrator(adminData: Administrator): Observable<Administrator> {

    return this.http.put<BackendAdminResponse<Administrator>>(ADMIN_API_BASE_URL, adminData)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }

  changePassword(id: number, password: string): Observable<boolean> {
    return this.http.patch<BackendAdminResponse<boolean>>(`${ADMIN_API_BASE_URL}/${id}/password`, password, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }

  deleteAdministrator(id: number): Observable<boolean> {
    return this.http.delete<BackendAdminResponse<boolean>>(`${ADMIN_API_BASE_URL}/${id}`)
      .pipe(
        map(response => response.payload),
        catchError(this.handleError)
      );
  }
/**
   * @param error
   * @returns
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao gerenciar administradores.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      if (error.error && error.error.errorDescription) {
        errorMessage = `${error.error.responseDescription || 'Erro'}: ${error.error.errorDescription}`;
      } else if (error.error && error.error.message) {
        errorMessage = `Erro: ${error.error.message}`;
      } else if (error.statusText && error.status !== 0) {
        errorMessage = `Erro ${error.status}: ${error.statusText}`;
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor.';
      }
    }
    console.error('Erro no AdministratorService:', error, 'Mensagem:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
