import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'; // Para diálogos de confirmação/edição
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Session } from './interfaces/session';
import { SessoesService } from './services/sessoes.service';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sessoes',
  templateUrl: './sessoes.component.html',
  styleUrls: ['./sessoes.component.scss'],
})
export class SessoesComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'deviceMac',
    'fullName',
    'hostname',
    'email',
    'deviceIp',
    'lastLoginOn',
    'expireLoginOn',
    'valid',
    'actions',
  ];
  dataSource = new MatTableDataSource<Session>();
  isLoading = true;
  error: string | null = null;
  resultsLength = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private sessoesService: SessoesService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog // Para diálogos
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } else {
      console.warn('Mat sort não encontrado.');
    }
    this.loadSessions();
  }

  loadSessions(filter: 'all' | 'valid' | 'expired' = 'all'): void {
    this.isLoading = true;
    this.error = null;
    let requestObservable: Observable<Session[]>;

    switch (filter) {
      case 'valid':
        requestObservable = this.sessoesService.getValidSessions();
        break;
      case 'expired':
        requestObservable = this.sessoesService.getExpiredSessions();
        break;
      default:
        requestObservable = this.sessoesService.getSessions();
        break;
    }
    requestObservable
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.resultsLength = data.length;
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
          this.error = err.message || 'Não foi possível carregar as sessões.';
          this.snackBar.open(this.error, 'Fechar', { duration: 5000 });
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

  viewSessionDetails(session: Session): void {
    console.log('Ver detalhes da sessão:', session);
    this.snackBar.open(
      `Detalhes da sessão ID ${session.id} (MAC: ${session.deviceMac})`,
      'OK',
      { duration: 3000 }
    );
  }
  deleteSession(session: Session): void {
    const sessionId: number = session.id as number;
    if (sessionId === null || sessionId === undefined) return;
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja deletar a sessão do dispositivo MAC: ${session.deviceMac})? Esta ação pode desconectar o usuário.`,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.isLoading = true;
        this.sessoesService
          .deleteSession(sessionId)
          .pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => (this.isLoading = false))
          )
          .subscribe({
            next: (success) => {
              if (success) {
                this.snackBar.open('Sessão deletada com sucesso!', 'OK', {
                  duration: 3000,
                });
                this.loadSessions();
              } else {
                this.snackBar.open('Falha ao deletar a sessão.', 'Erro', {
                  duration: 3000,
                });
              }
            },
            error: (err: Error) => {
              this.snackBar.open(
                err.message || 'Erro ao deletar sessão.',
                'Fechar',
                { duration: 3000 }
              );
            },
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
