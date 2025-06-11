import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TermsAndPrivacy } from '../interfaces/tools';
import { environment } from 'src/environments/environment';

const apiUrl = `${environment.backendApiUrl}/api/admin/terms`
@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  constructor(private http: HttpClient) { }
  getTermsByType(type: string): Observable<TermsAndPrivacy>{
    return this.http.get<TermsAndPrivacy>(`${apiUrl}/${type}`)
  }
  getAllTerms(): Observable<TermsAndPrivacy[]>{
    return this.http.get<TermsAndPrivacy[]>(apiUrl);
  }
  saveOrUpdateTerms(terms: TermsAndPrivacy): Observable<TermsAndPrivacy>{
    return this.http.post<TermsAndPrivacy>(apiUrl,terms)
  }
}
