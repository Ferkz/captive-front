import { Setting, TermsAndPrivacy } from './../interfaces/tools';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// URLs base separadas para cada tipo de recurso
const TERMS_API_URL = `${environment.backendApiUrl}/api/terms`;
const SETTINGS_API_URL = `${environment.backendApiUrl}/api/admin/settings`;

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  constructor(private http: HttpClient) { }

  // --- Métodos para Termos e Política de Privacidade ---

  getTermsByType(type: string): Observable<TermsAndPrivacy> {
    return this.http.get<TermsAndPrivacy>(`${TERMS_API_URL}/${type}`);
  }

  getAllTerms(): Observable<TermsAndPrivacy[]> {
    return this.http.get<TermsAndPrivacy[]>(TERMS_API_URL);
  }

  saveOrUpdateTerms(terms: TermsAndPrivacy): Observable<TermsAndPrivacy> {
    return this.http.post<TermsAndPrivacy>(TERMS_API_URL, terms);
  }

  // --- Métodos para Configurações (Settings) ---

  /**
   * Busca uma configuração específica pelo seu nome.
   * @param settingName O nome da configuração (ex: 'unifi.default.auth.minutes').
   * @returns Um Observable com a configuração encontrada.
   */
  getSetting(settingName: string): Observable<Setting> {
    // Requisições GET passam identificadores na URL, não no corpo.
    return this.http.get<Setting>(`${SETTINGS_API_URL}/${settingName}`);
  }

  /**
   * Salva ou atualiza uma configuração.
   * @param setting O objeto de configuração a ser salvo.
   * @returns Um Observable com a configuração salva.
   */
  saveSetting(setting: Setting): Observable<Setting> {
    return this.http.post<Setting>(SETTINGS_API_URL, setting);
  }
}
