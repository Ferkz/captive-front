import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Administrator } from './interfaces/administrator';
import { AdministratorService } from './services/administrator.service';

@Component({
  selector: 'app-administradores',
  templateUrl: './administradores.component.html',
  styleUrls: ['./administradores.component.scss']
})
export class AdministradoresComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'fullName',
    'email',
    'enabled',
    'creationDate',
    'lastModification',
    'actions'
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
  ) { }

  ngOnInit(): void {
    this.loadAdministrators();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.dataSource.paginator) {
      this.dataSource.paginator._intl.itemsPerPageLabel = 'Itens por página';
    }
  }

  loadAdministrators(): void {
    this.isLoading = true;
    this.error = null;
    this.administratorService.getAdministrators()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
        },
        error: (err: Error) => {
          this.error = err.message || 'Não foi possível carregar os administradores.';
          this.snackBar.open(this.error, 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
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

  openAddAdminDialog(): void {
    // const dialogRef = this.dialog.open(AdminFormComponent, {
    //   width: '500px',
    //   data: { admin: null, isEditMode: false } // Para um novo admin
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) { // Se o diálogo retornou dados (ou seja, salvou)
    //     this.loadAdministrators();
    //     this.snackBar.open('Administrador adicionado com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar']});
    //   }
    // });
    this.snackBar.open('Funcionalidade Adicionar Admin - A implementar diálogo.', 'OK', { duration: 2000 });
  }

  openEditAdminDialog(admin: Administrator): void {
    // const dialogRef = this.dialog.open(AdminFormComponent, {
    //   width: '500px',
    //   data: { admin: { ...admin }, isEditMode: true } // Envia uma cópia
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.loadAdministrators();
    //     this.snackBar.open('Administrador atualizado com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar']});
    //   }
    // });
    this.snackBar.open(`Editar Admin ID ${admin.id} - A implementar diálogo.`, 'OK', { duration: 2000 });
  }

  openChangePasswordDialog(admin: Administrator): void {
    // const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
    //   width: '400px',
    //   data: { adminId: admin.id, adminFullName: admin.fullName }
    // });

    // dialogRef.afterClosed().subscribe(success => {
    //   if (success) {
    //     this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar']});
    //   }
    // });
    this.snackBar.open(`Mudar Senha Admin ID ${admin.id} - A implementar diálogo.`, 'OK', { duration: 2000 });
  }

  deleteAdministrator(admin: Administrator): void {
    if (!admin.id) return;

    const confirmDelete = confirm(`Tem certeza que deseja deletar o administrador "${admin.fullName}" (Email: ${admin.email})? Esta ação não pode ser desfeita.`);
    if (confirmDelete) {
      this.isLoading = true;
      this.administratorService.deleteAdministrator(admin.id)
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
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
