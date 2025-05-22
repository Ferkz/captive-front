import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Para chamadas diretas ou use um InfoService
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SystemMemory {
  total?: number;
  free?: number;
  used?: number;
  max?: number;
  fsfree?: number;
  fstotal?: number;
}

export interface SystemInfo {
  hostname?: string;
  ipAddress?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;
  javaVersion?: string;
  javaVendor?: string;
  osArch?: string;
}

export interface CountData {
  name?: string;
  os?: string;
  browser?: string;
  quantity?: number;
}

export interface AdminDashboardData {
  systemMemory?: SystemMemory;
  systemInfo?: SystemInfo;
  osCounts?: CountData[];
  browserCounts?: CountData[];
  validSessionsCount?: number;
  expiredSessionsCount?: number;
  totalSessionsCount?: number;
}

const INFO_API_BASE_URL = 'http://localhost:8080/api/admin/info';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: AdminDashboardData = {};
  isLoading = true;
  error: string | null = null;

  private unsubscribe$ = new Subject<void>();

  constructor(private http: HttpClient) { } // Idealmente, crie um InfoService

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<{ payload: number }>(`${INFO_API_BASE_URL}/sessions/valid/count`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.dashboardData.validSessionsCount = response.payload;
          // Chame outros endpoints aqui para popular o resto do dashboardData
          this.fetchSystemMemory(); // Exemplo de encadeamento ou chamadas separadas
        },
        error: (err) => {
          console.error('Erro ao buscar contagem de sessões válidas:', err);
          this.error = 'Não foi possível carregar a contagem de sessões válidas.';
          this.isLoading = false; // Parar o loading mesmo em caso de erro parcial
        }
      });
  }

  fetchSystemMemory(): void {
    this.http.get<{ payload: SystemMemory }>(`${INFO_API_BASE_URL}/system/memory`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.dashboardData.systemMemory = response.payload;
          // Chamar próximo dado
          this.fetchSystemInfo();
        },
        error: (err) => this.handleDataFetchError('memória do sistema', err)
      });
  }

  fetchSystemInfo(): void {
    this.http.get<{ payload: SystemInfo }>(`${INFO_API_BASE_URL}/system/info`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.dashboardData.systemInfo = response.payload;
          // Chamar próximo dado
          this.fetchOsCounts();
        },
        error: (err) => this.handleDataFetchError('informações do sistema', err)
      });
  }

  fetchOsCounts(): void {
    this.http.get<{ payload: CountData[] }>(`${INFO_API_BASE_URL}/sessions/os-count`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.dashboardData.osCounts = response.payload;
          // Chamar próximo dado
          this.fetchBrowserCounts();
        },
        error: (err) => this.handleDataFetchError('contagem de OS', err)
      });
  }

  fetchBrowserCounts(): void {
     this.http.get<{ payload: CountData[] }>(`${INFO_API_BASE_URL}/sessions/browser-count`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.dashboardData.browserCounts = response.payload;
          // Última chamada, então paramos o loading
          this.isLoading = false;
        },
        error: (err) => {
            this.handleDataFetchError('contagem de navegadores', err);
            this.isLoading = false; // Parar loading mesmo em erro
        }
      });
  }


  private handleDataFetchError(dataType: string, error: any): void {
    console.error(`Erro ao buscar ${dataType}:`, error);
    this.error = `Não foi possível carregar dados de ${dataType}.`;
  }

  formatBytes(bytes: number | undefined, decimals = 2): string {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
