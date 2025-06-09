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
  _paginator!: MatPaginator;
  _sort!: MatSort;

  @ViewChild(MatPaginator, {static:false})
  set paginator(value:MatPaginator){
    if(value){
      this._paginator = value;
      this.dataSource.paginator = this._paginator
      this._paginator._intl.itemsPerPageLabel = 'Itens por página'
      this._paginator.length=this.resultsLength
    }
    else{
      console.warn('Setter matpaginator null');
    }
  }
  @ViewChild(MatSort, {static:false})
  set sort(value: MatSort) {
    console.log('AccessLogsComponent: Setter MatSort - Valor recebido:', value);
    if (value) {
      this._sort = value;
      this.dataSource.sort = this._sort;
      this._sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        console.log('AccessLogsComponent: Sort changed - Resetting paginator to first page.');
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
      console.log('Sort atribuído ao dataSource via setter.');
    } else {
      console.warn('Setter MatSort null.');
    }
  }

  private unsubscribe$ = new Subject<void>();

  constructor(
    private accessLogService: AccessLogService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loadAccessLogs();
  }

  loadAccessLogs(): void {
    this.isLoading = true;
    this.error = null;

    this.accessLogService
      .getAccessLogs(0, 1000, false)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.resultsLength = data.length;
          if (this._paginator) {
          this._paginator.length = this.resultsLength
          this._paginator.firstPage();
            this.paginator._intl.itemsPerPageLabel = 'Itens por página';
            console.log(
              'AccessLogsComponent: loadAccessLogs - dataSource.paginator atribuído no next().'
            );
          } else {
            console.warn(
              'AccessLogsComponent: loadAccessLogs - MatPaginator ainda não encontrado no next().'
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
