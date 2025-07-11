import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Devices } from '../interface/devices';
import { environment } from 'src/environments/environment';

const API_URL = `${environment.backendApiUrl}/api/admin/devices`;

@Injectable({
  providedIn: 'root'
})
export class DevicesService {

  constructor(private http: HttpClient) { }
  getDevices(): Observable<Devices[]> {
    return this.http.get<Devices[]>(API_URL);
  }
  restartDevice(deviceId: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/${deviceId}/restart`, {});
  }
}
