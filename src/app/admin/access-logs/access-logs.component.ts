import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import {
  takeUntil,
  finalize,
  startWith,
  switchMap,
  catchError,
  map,
} from 'rxjs/operators';
import { Logs } from './interfaces/logs';
import { AccessLogService } from './services/access-log.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm/confirm-dialog/confirm-dialog.component';
// import { ViewLogDialogComponent } from './view-log-dialog/view-log-dialog.component'; // Para ver detalhes

@Component({
  selector: 'app-access-logs',
  templateUrl: './access-logs.component.html',
  styleUrls: ['./access-logs.component.scss'],
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
    'actions',
  ];
  dataSource = new MatTableDataSource<Logs>();
  isLoading = true;
  error: string | null = null;

  resultsLength = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private accessLogService: AccessLogService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    console.log('AccesslogComponent: ngAfterViewInit = executado');
    if (this.sort) {
      this.dataSource.sort = this.sort;
      console.log('AccessLogComponent ');
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } else {
      console.warn(
        'AccessLogsComponent: ngAfterViewInit - setTimeout - MatSort não encontrado.'
      );
    }
    this.loadAccessLogs();
  }

  loadAccessLogs(): void {
    this.isLoading = true;
    this.error = null;
    // O endpoint do backend `/api/admin/accessLogs` não parece ter paginação robusta
    // na sua definição atual. Ele aceita 'paging', 'page', 'size' mas retorna List<AccessLogDTO>.
    // Para MatPaginator funcionar bem com dados do servidor, precisaríamos que o backend
    // retornasse o total de itens também.
    // Por enquanto, vamos buscar todos e paginar no frontend.
    this.accessLogService
      .getAccessLogs(0, 1000, false) // Buscar um número grande, sem paginação no backend
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.resultsLength = data.length; // Atualiza o total para o paginador
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
            this.paginator._intl.itemsPerPageLabel = 'Itens por página';
            console.log(
              'AccessLogsComponent: loadAccessLogs - dataSource.paginator atribuído no next().'
            );
          } else {
            console.warn(
              'AccessLogsComponent: loadAccessLogs - MatPaginator ainda não encontrado no next().'
            );
          }
          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
            this.dataSource.paginator.length = this.resultsLength;
            console.log(
              'AccessLogsComponent: loadAccessLogs - Paginator firstPage() e length atualizado para:',
              this.dataSource.paginator.length
            );
          }

          if (this.dataSource.filter) {
            this.dataSource.filter = this.dataSource.filter;
            if (this.dataSource.paginator) {
              this.dataSource.paginator.firstPage();
            }
          }
        },
        error: (err: Error) => {
          this.error =
            err.message || 'Não foi possível carregar os logs de acesso.';
          this.snackBar.open(this.error, 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
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
    this.snackBar.open(
      `Detalhes do Log ID ${log.id} (MAC: ${log.deviceMac})`,
      'OK',
      { duration: 3000 }
    );
  }

  deleteLog(log: Logs): void {
     const logId: number = log.id as number;
    if (logId === undefined || logId ===null) return;
     const dialogData: ConfirmDialogData ={
          title: 'Confirmar Exclusão',
          message: `Tem certeza que deseja excluir o log "${log.id}" (Device MAC: ${log.deviceMac})? Esta ação não pode ser desfeita.`,
          confirmButtonText: 'Excluir',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: 'warn'
        }
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{
          width: '400px',
          data: dialogData,
          disableClose: true
        })
    dialogRef.afterClosed().subscribe(confirm=>{
      if (confirm) {
      this.isLoading = true;
      this.accessLogService
        .deleteAccessLog(logId)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => (this.isLoading = false))
        )
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('Log deletado com sucesso!', 'OK', {
                duration: 3000,
                panelClass: ['success-snackbar'],
              });
              this.loadAccessLogs();
            } else {
              this.snackBar.open('Falha ao deletar o log.', 'Erro', {
                duration: 3000,
                panelClass: ['error-snackbar'],
              });
            }
          },
          error: (err: Error) => {
            this.snackBar.open(
              err.message || 'Erro ao deletar log.',
              'Fechar',
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          },
        });
    }else{
      console.log('Exclusão de administrador cancelada.');
    }
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
