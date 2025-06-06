import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdministratorService } from '../services/administrator.service';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  passwordForm: FormGroup;
  adminId: number;
  adminFullName: string;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { adminId: number; adminFullName: string },
    private fb: FormBuilder,
    private administratorService: AdministratorService,
    private snackBar: MatSnackBar
  ) {
    this.adminId = data.adminId;
    this.adminFullName = data.adminFullName;

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {}
  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.administratorService.changePassword(this.adminId, newPassword)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open('Falha ao alterar a senha. Tente novamente.', 'Erro', { duration: 3000, panelClass: ['error-snackbar'] });
          }
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao comunicar com o servidor.', 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }
}
