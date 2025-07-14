import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import {
  AdminDashboardData,
  AnalyticsDashboardDTO,
  CountData,
  DeviceStatsDTO,
  SystemInfo,
  SystemMemory,
} from './interfaces/dashboard';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const INFO_API_BASE_URL = `${environment.backendApiUrl}/api/admin/info`;
const DEVICES_API_BASE_URL = `${environment.backendApiUrl}/api/admin/devices`;
const ANALYTICS_API_BASE_URL = `${environment.backendApiUrl}/api/admin/analytics`;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: AdminDashboardData = {};
  isLoading = true;
  error: string | null = null;

  public osChartData!: ChartData<'doughnut'>;
  public browserChartData!: ChartData<'doughnut'>;
  public newVsReturningChartData!: ChartData<'doughnut'>;
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      datalabels: {
        formatter: (value, ctx) => {
          const dataArr = ctx.chart.data.datasets[0].data as number[];
          const sum = dataArr.reduce((a, b) => a + b, 0);
          if (sum === 0) {
            return '0%';
          }
          const percentage = ((value * 100) / sum).toFixed(1) + '%';
          return (value * 100) / sum > 5 ? percentage : '';
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12,
        },
        textStrokeColor: 'black',
        textStrokeWidth: 1,
      },
    },
  };

  private unsubscribe$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    Chart.register(ChartDataLabels);
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      validSessionsCount: this.http.get<{ payload: number }>(
        `${INFO_API_BASE_URL}/sessions/valid/count`
      ),
      systemMemory: this.http.get<{ payload: SystemMemory }>(
        `${INFO_API_BASE_URL}/system/memory`
      ),
      systemInfo: this.http.get<{ payload: SystemInfo }>(
        `${INFO_API_BASE_URL}/system/info`
      ),
      osCounts: this.http.get<{ payload: CountData[] }>(
        `${INFO_API_BASE_URL}/sessions/os-count`
      ),
      browserCounts: this.http.get<{ payload: CountData[] }>(
        `${INFO_API_BASE_URL}/sessions/browser-count`
      ),
      deviceStats: this.http.get<DeviceStatsDTO>(
        `${DEVICES_API_BASE_URL}/stats`
      ),
      analytics: this.http.get<AnalyticsDashboardDTO>(`${ANALYTICS_API_BASE_URL}/summary`)
    })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (results) => {
          this.dashboardData = {
            validSessionsCount: results.validSessionsCount.payload,
            systemMemory: results.systemMemory.payload,
            systemInfo: results.systemInfo.payload,
            osCounts: results.osCounts.payload,
            browserCounts: results.browserCounts.payload,
            deviceStats: results.deviceStats,
            analytics: results.analytics,
          };

          this.prepareChartData();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar dados do dashboard:', err);
          this.error = 'Não foi possível carregar os dados do dashboard.';
          this.isLoading = false;
        },
      });
  }

  prepareChartData(): void {
    if (this.dashboardData.osCounts && this.dashboardData.osCounts.length > 0) {
      const labels = this.dashboardData.osCounts.map(
        (item) => item.os || item.name || 'Desconhecido'
      );
      const data = this.dashboardData.osCounts.map(
        (item) => item.quantity || 0
      );

      this.osChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ['#3b82f6','#ef4444','#22c55e','#eab308','#8b5cf6'],
            hoverBackgroundColor: ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      };
    }

    if (
      this.dashboardData.browserCounts &&
      this.dashboardData.browserCounts.length > 0
    ) {
      const labels = this.dashboardData.browserCounts.map(
        (item) => item.browserName || 'Desconhecido'
      );
      const data = this.dashboardData.browserCounts.map(
        (item) => item.quantity || 0
      );

      this.browserChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ['#f97316','#06b6d4','#d946ef','#14b8a6','#64748b'],
            hoverBackgroundColor: ['#ea580c','#0891b2','#c026d3','#0d9488','#475569'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      };
    }
    if (this.dashboardData.analytics?.newVsReturning) {
      const { newUsers, returningUsers } = this.dashboardData.analytics.newVsReturning;
      this.newVsReturningChartData = {
        labels: ['Novos Usuários', 'Usuários Recorrentes'],
        datasets: [{
          data: [newUsers, returningUsers],
          backgroundColor: ['#34d399', '#60a5fa'],
          hoverBackgroundColor: ['#10b981', '#3b82f6'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
    }
  }

  formatBytes(bytes: number | undefined, decimals = 2): string {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    Chart.unregister(ChartDataLabels);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
