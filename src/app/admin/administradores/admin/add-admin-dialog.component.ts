import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdministratorService } from '../services/administrator.service';
import { AdministratorAddRequest } from '../interfaces/administrator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
@Component({
  selector: 'app-add-admin-dialog',
  templateUrl: './add-admin-dialog.component.html',
  styleUrls: ['./add-admin-dialog.component.scss'],
})
export class AddAdminDialogComponent implements OnInit {
  addAdminForm: FormGroup;
  isEditMode: boolean;
  adminId: number | null = null;

  isLoading = false;
  errorMessage: string | null = null;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddAdminDialogComponent>,
    private adminService: AdministratorService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = data?.isEditMode || false;
    this.adminId = data?.admin?.id || null;

    this.addAdminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', this.isEditMode ? null : [Validators.required, Validators.minLength(6)]],
      enabled: [true, Validators.required]
    });
     if (this.isEditMode && data.admin) {
      this.addAdminForm.patchValue({
        fullName: data.admin.fullName,
        email: data.admin.email,
        enabled: data.admin.enabled
      });
      this.addAdminForm.get('email')?.disable();
    }
  }
  ngOnInit(): void {}

  get f() {
    return this.addAdminForm.controls;
  }
  onSubmit(): void {
    this.errorMessage = null;
    if (this.addAdminForm.invalid) {
      this.addAdminForm.markAllAsTouched();
      this.errorMessage =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      return;
    }

    this.isLoading = true;
    const newAdmin: AdministratorAddRequest = this.addAdminForm.getRawValue();
     if (this.isEditMode && this.adminId) {
      // Modo de Edição
      newAdmin.id = this.adminId;
      console.log(this.adminId);

      this.adminService.updateAdministrator( this.adminId, newAdmin)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('Administrador atualizado com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
              this.dialogRef.close(true);
            } else {
              this.snackBar.open('Falha ao atualizar administrador. Tente novamente.', 'Erro', { duration: 3000, panelClass: ['error-snackbar'] });
            }
          },
          error: (err: Error) => {
            this.snackBar.open(err.message || 'Erro ao comunicar com o servidor.', 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        });
    }else{
       this.adminService
      .addAdministrator(newAdmin)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.snackBar.open('Administrador adicionado com sucesso!', 'OK', {
            duration: 3000,
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erro ao adicionar administrador.';
          this.snackBar.open(
            this.errorMessage || 'Error desconhecido',
            'Fechar',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          console.error('Erro ao adicionar admin:', err);
          if (
            err.error &&
            err.error.description === 'Email Already Registered'
          ) {
            this.errorMessage = 'Este e-mail já está cadastrado.';
          }
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
