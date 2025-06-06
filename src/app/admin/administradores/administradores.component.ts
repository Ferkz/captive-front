import { ConfirmDialogComponent, ConfirmDialogData } from './../confirm/confirm-dialog/confirm-dialog.component';
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
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Administrator } from './interfaces/administrator';
import { AdministratorService } from './services/administrator.service';
import { AddAdminDialogComponent } from './admin/add-admin-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-administradores',
  templateUrl: './administradores.component.html',
  styleUrls: ['./administradores.component.scss'],
})
export class AdministradoresComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  displayedColumns: string[] = [
    'id',
    'fullName',
    'email',
    'enabled',
    'creationDate',
    'lastModification',
    'actions',
  ];
  dataSource = new MatTableDataSource<Administrator>();
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private administratorService: AdministratorService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAdministrators();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('ngAfterViewInit: Executado');
      console.log(
        'ngAfterViewInit: this.paginator (referência DOM):',
        this.paginator
      );
      console.log('ngAfterViewInit: this.sort (referência DOM):', this.sort);
      if (this.sort) {
        this.dataSource.sort = this.sort;
        this.sort.sortChange
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(() => {
            console.log('Sort changed: Resetting paginator to first page.');
            if (this.dataSource.paginator) {
              this.dataSource.paginator.firstPage();
            }
          });
      } else {
        console.warn('ngAfterViewInit: MatSort não encontrado.');
      }
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator._intl.itemsPerPageLabel = 'Itens por página';
        this.dataSource.paginator.length = this.dataSource.data.length;
        console.log(
          'ngAfterViewInit: dataSource.paginator atribuído. paginator.length inicial:',
          this.dataSource.paginator.length
        );
      } else {
        console.warn('ngAfterViewInit: MatPaginator não encontrado.');
      }
    }, 0);
  }

  loadAdministrators(): void {
    console.log('loadAdministrators: Iniciando carregamento...');

    this.isLoading = true;
    this.error = null;
    this.administratorService
      .getAdministrators()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          if (this.dataSource.paginator) {
            console.log(
              'loadAdministrators: Forçando firstPage() e atualizando paginator.length.'
            );
            this.dataSource.paginator.firstPage();

            this.dataSource.paginator.length = this.dataSource.data.length;
            console.log(
              'loadAdministrators: dataSource.paginator.length atualizado para:',
              this.dataSource.paginator.length
            );
          }

          console.warn(
            'loadAdministrators: Paginator ainda não está atribuído ao dataSource, mesmo após next(). Isso pode indicar um problema de timing complexo.'
          );
          setTimeout(() => {
            if (this.paginator && !this.dataSource.paginator) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.paginator.firstPage();
              this.dataSource.paginator.length = this.dataSource.data.length;
              console.log(
                'loadAdministrators: Paginator atribuído e atualizado via setTimeout de fallback.'
              );
            }
          }, 0);
        },
        error: (err: Error) => {
          this.error =
            err.message || 'Não foi possível carregar os administradores.';
          this.snackBar.open(this.error, 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  openAdminDialog(): void {
    const dialogRef = this.dialog.open(AddAdminDialogComponent, {
      width: '400px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadAdministrators();
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
  openEditAdminDialog(admin: Administrator): void {
    const dialogRef = this.dialog.open(AddAdminDialogComponent, {
      width: '500px',
      data: { admin: { ...admin }, isEditMode: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAdministrators();
        this.snackBar.open('Administrador atualizado com sucesso!', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      }
    });
  }

  openChangePasswordDialog(admin: Administrator): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      data: { adminId: admin.id, adminFullName: admin.fullName },
    });

    dialogRef.afterClosed().subscribe((success) => {
      if (success) {
        this.snackBar.open('Senha alterada com sucesso!', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      }
    });
  }

  deleteAdministrator(admin: Administrator): void {
    const adminId: number = admin.id as number;

    if (adminId=== undefined || adminId ===null) return;

    const dialogData: ConfirmDialogData ={
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o administrador "${admin.fullName}" (Email: ${admin.email})? Esta ação não pode ser desfeita.`,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn'
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{
      width: '400px',
      data: dialogData,
      disableClose: true
    })
     dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.administratorService.deleteAdministrator(adminId)
          .pipe(
              takeUntil(this.unsubscribe$),
              finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (success) => {
              if (success) {
                this.snackBar.open('Administrador deletado com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar']});
                this.loadAdministrators();
              } else {
                this.snackBar.open('Falha ao deletar o administrador. Pode ser uma operação inválida (ex: último admin).', 'Erro', { duration: 5000, panelClass: ['error-snackbar'] });
              }
            },
            error: (err: Error) => {
              this.snackBar.open(err.message || 'Erro ao deletar administrador.', 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
            }
          });
      } else {
        console.log('Exclusão de administrador cancelada.');
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
