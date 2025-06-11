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
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Session } from './interfaces/session';
import { SessoesService } from './services/sessoes.service';
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
    'cpf',
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

  _paginator!: MatPaginator;
  _sort!: MatSort;
  @ViewChild(MatPaginator, { static:false})
  set paginator(value: MatPaginator){
    if(value){
      this._paginator = value;
      this.dataSource.paginator = this._paginator
      this._paginator._intl.itemsPerPageLabel = 'itens por página'
      this._paginator.length = this.resultsLength
      console.log('Sessoescomponet: paginator atribuido ao datasource via setter');
    }
    else{
      console.warn('sessoescomponent: setter matpaginator null');
    }
  }

  @ViewChild(MatSort, {static:false})
  set sort(value: MatSort){
     console.log('SessoesComponent: Setter MatSort - Valor recebido:', value);
    if (value) {
      this._sort = value; // Atribui à variável interna
      this.dataSource.sort = this._sort; // Atribui ao dataSource
      // Assinar o sortChange aqui, garantindo que ele só ocorra uma vez por instância de sort
      this._sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        console.log('SessoesComponent: Sort changed - Resetting paginator to first page.');
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
      console.log('SessoesComponent: Sort atribuído ao dataSource via setter.');
    } else {
      console.warn('SessoesComponent: Setter MatSort - Valor nulo.');
    }

  }

  private unsubscribe$ = new Subject<void>();

  constructor(
    private sessoesService: SessoesService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    console.log('SessoesComponent: Constructor - dataSource inicializado.');
  }

  ngOnInit(): void {
    console.log('SessoesComponent: ngOnInit - nenhum carregamento inicial aqui, será feito em ngAfterViewInit.');
  }

  ngAfterViewInit(): void {
  this.loadSessions();
  }

  loadSessions(filter: 'all' | 'valid' | 'expired' = 'all'): void {
    console.log('SessoesComponent: loadSessions - Iniciando carregamento com filtro:', filter);
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
        finalize(() => {
          this.isLoading = false;
          console.log('SessoesComponent: loadSessions - Carregamento finalizado. isLoading:', this.isLoading);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('SessoesComponent: loadSessions - Dados recebidos:', data);
          this.dataSource.data = data;
          console.log('SessoesComponent: loadSessions - dataSource.data.length após atribuição:', this.dataSource.data.length);
         console.log('cpf', data[0]?.cpf);

          this.resultsLength = data.length;
          if (this._paginator) {
            this._paginator._intl.itemsPerPageLabel = 'Itens por página';
            this._paginator.firstPage();
          }
          if (this.dataSource.filter) {
            this.dataSource.filter = this.dataSource.filter;
            if (this.dataSource.paginator) {
                this.dataSource.paginator.firstPage();
            }
          }
        },
        error: (err: Error) => {
          console.error('SessoesComponent: loadSessions - Erro ao carregar sessões:', err);
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
    console.log('SessoesComponent: Ver detalhes da sessão:', session);
    this.snackBar.open(
      `Detalhes da sessão ID ${session.id} (MAC: ${session.deviceMac})`,
      'OK',
      { duration: 3000 }
    );
  }

  deleteSession(session: Session): void {
    const sessionId: number = session.id as number;
    if (sessionId === null || sessionId === undefined) {
        console.error('SessoesComponent: ID da sessão é inválido ou nulo. Não é possível excluir.');
        return;
    }
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
                this.loadSessions(); // Recarrega a lista
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
    console.log('SessoesComponent: ngOnDestroy - Componente sendo destruído.');
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
