import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize, startWith, switchMap, catchError, map } from 'rxjs/operators';
import { Logs } from './interfaces/logs';
import { AccessLogService } from './services/access-log.service';
// import { ViewLogDialogComponent } from './view-log-dialog/view-log-dialog.component'; // Para ver detalhes

@Component({
  selector: 'app-access-logs',
  templateUrl: './access-logs.component.html',
  styleUrls: ['./access-logs.component.scss']
})
export class AccessLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'deviceMac',
    'deviceIp',
    'accesspointMac',
    'lastLoginOn',
    'expireLoginOn',
    // 'removeSessionOn', // Pode ser muito detalhado para a tabela principal
    'browser',
    'operatingSystem',
    'actions'
  ];
  dataSource = new MatTableDataSource<Logs>();
  isLoading = true;
  error: string | null = null;

  resultsLength = 0;
  pageSize = 10; // Default page size
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private accessLogService: AccessLogService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // O carregamento inicial é acionado pelo ngAfterViewInit e pelo paginador
  }

  ngAfterViewInit(): void {
    // Se houver ordenação no backend, mesclar com eventos de sort. Por enquanto, ordenação do lado do cliente.
    this.dataSource.sort = this.sort;

    // Se o usuário mudar a ordenação, resetar para a primeira página.
    if (this.sort) {
        this.sort.sortChange.subscribe(() => {
            if (this.paginator) this.paginator.pageIndex = 0;
        });
    }

    // Carregar dados quando a página, tamanho da página ou ordenação mudar.
    // Para simplificar, o backend atual não suporta ordenação via API.
    // A paginação no backend é básica (paging=true, page, size).
    // Vamos usar a paginação do MatPaginator e buscar todos os logs (ou implementar paginação no serviço).
    // Por agora, buscaremos todos e deixaremos MatPaginator cuidar da paginação no frontend.
    // Para paginação real no backend, o `merge` com `this.paginator.page` seria usado para chamar `loadAccessLogs`.
    this.loadAccessLogs();
    if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator._intl.itemsPerPageLabel = 'Itens por página';
    }
  }

  loadAccessLogs(): void {
    this.isLoading = true;
    this.error = null;
    // O endpoint do backend `/api/admin/accessLogs` não parece ter paginação robusta
    // na sua definição atual. Ele aceita 'paging', 'page', 'size' mas retorna List<AccessLogDTO>.
    // Para MatPaginator funcionar bem com dados do servidor, precisaríamos que o backend
    // retornasse o total de itens também.
    // Por enquanto, vamos buscar todos e paginar no frontend.
    this.accessLogService.getAccessLogs(0, 1000, false) // Buscar um número grande, sem paginação no backend
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.resultsLength = data.length; // Atualiza o total para o paginador
          // O paginador será atribuído em ngAfterViewInit
        },
        error: (err: Error) => {
          this.error = err.message || 'Não foi possível carregar os logs de acesso.';
          this.snackBar.open(this.error, 'Fechar', { duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewLogDetails(log: Logs): void {
    console.log('Ver detalhes do Log:', log);
    // Implementar diálogo para mostrar mais detalhes, se houver
    // const dialogRef = this.dialog.open(ViewLogDialogComponent, { data: log });
    this.snackBar.open(`Detalhes do Log ID ${log.id} (MAC: ${log.deviceMac})`, 'OK', { duration: 3000 });
  }

  deleteLog(log: Logs): void {
    if (!log.id) return;
    const confirmDelete = confirm(`Tem certeza que deseja deletar o Log ID: ${log.id} (Dispositivo MAC: ${log.deviceMac})?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.accessLogService.deleteAccessLog(log.id)
        .pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('Log deletado com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
              this.loadAccessLogs(); // Recarrega a lista
            } else {
              this.snackBar.open('Falha ao deletar o log.', 'Erro', { duration: 3000, panelClass: ['error-snackbar']});
            }
          },
          error: (err: Error) => {
            this.snackBar.open(err.message || 'Erro ao deletar log.', 'Fechar', { duration: 3000, panelClass: ['error-snackbar'] });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
