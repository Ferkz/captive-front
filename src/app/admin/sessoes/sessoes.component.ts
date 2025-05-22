import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
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

@Component({
  selector: 'app-sessoes',
  templateUrl: './sessoes.component.html',
  styleUrls: ['./sessoes.component.scss']
})
export class SessoesComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'deviceMac',
    'fullName', // Adicionado
    'email',    // Adicionado
    'deviceIp',
    // 'accesspointMac',
    'lastLoginOn',
    'expireLoginOn',
    'valid',
    'actions'
  ];
  dataSource = new MatTableDataSource<Session>();
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private sessoesService: SessoesService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog // Para diálogos
  ) { }

  ngOnInit(): void {
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.dataSource.paginator) {
      this.dataSource.paginator._intl.itemsPerPageLabel = 'Itens por página'; // Tradução
    }
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
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
        },
        error: (err: Error) => {
          this.error = err.message || 'Não foi possível carregar as sessões.';
          this.snackBar.open(this.error, 'Fechar', { duration: 5000 });
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

  viewSessionDetails(session: Session): void {
    console.log('Ver detalhes da sessão:', session);
    this.snackBar.open(`Detalhes da sessão ID ${session.id} (MAC: ${session.deviceMac})`, 'OK', { duration: 3000 });
  }
  deleteSession(session: Session): void {
    if (!session.id) return;
    // Adicionar um diálogo de confirmação aqui
    const confirmDelete = confirm(`Tem certeza que deseja deletar a sessão do dispositivo MAC: ${session.deviceMac}? Esta ação pode desconectar o usuário.`);
    if (confirmDelete) {
      this.isLoading = true;
      this.sessoesService.deleteSession(session.id)
        .pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('Sessão deletada com sucesso!', 'OK', { duration: 3000 });
              this.loadSessions(); // Recarrega a lista
            } else {
              this.snackBar.open('Falha ao deletar a sessão.', 'Erro', { duration: 3000 });
            }
          },
          error: (err: Error) => {
            this.snackBar.open(err.message || 'Erro ao deletar sessão.', 'Fechar', { duration: 3000 });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
