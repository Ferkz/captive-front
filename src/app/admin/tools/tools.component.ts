import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TermsAndPrivacy, Setting } from './interfaces/tools';
import { ToolsService } from './services/tools.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  termsForm!: FormGroup;
  privacyForm!: FormGroup;
  connectionTimeForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private toolsService: ToolsService,
    private snackBar: MatSnackBar
  ) {
    this.termsForm = this.fb.group({
      content: ['', Validators.required]
    });
    this.privacyForm = this.fb.group({
      content: ['', Validators.required]
    });
    this.connectionTimeForm = this.fb.group({
      duration: [240, [Validators.required, Validators.min(10)]]
    });
  }

  ngOnInit(): void {
    this.loadTerms('TERMS_OF_USE', this.termsForm);
    this.loadTerms('PRIVACY_POLICY', this.privacyForm);
    this.loadConnectionTime();
  }

  loadTerms(type: string, form: FormGroup): void {
    this.toolsService.getTermsByType(type)
      .subscribe({
        next: (terms) => {
          if (terms && terms.content) {
            form.patchValue({ content: terms.content });
          }
        },
        error: (err) => {
          console.error(`Erro ao carregar ${type}:`, err);
        }
      });
  }

  saveTerms(type: string, form: FormGroup): void {
    if (form.invalid) {
      this.snackBar.open('O conteúdo não pode ser vazio.', 'Fechar', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    const terms: TermsAndPrivacy = {
      type: type,
      content: form.value.content
    };
    this.toolsService.saveOrUpdateTerms(terms)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.snackBar.open(`${type === 'TERMS_OF_USE' ? 'Termos de Uso' : 'Política de Privacidade'} salvos com sucesso!`, 'Fechar', { duration: 3000 });
        },
        error: (err) => {
          console.error(`Erro ao salvar ${type}:`, err);
          this.snackBar.open(`Erro ao salvar ${type}.`, 'Fechar', { duration: 3000 });
        }
      });
  }

  loadConnectionTime(): void {
    this.isLoading = true;
    this.toolsService.getSetting('unifi.default.auth.minutes')
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (setting) => {
          if (setting && setting.value) {
            this.connectionTimeForm.patchValue({ duration: Number(setting.value) });
          }
        },
        error: (err) => {
          console.error('Erro ao carregar tempo de conexão:', err);
        }
      });
  }

  saveConnectionTime(): void {
    if (this.connectionTimeForm.invalid) {
      this.snackBar.open('Valor inválido para o tempo de conexão.', 'Fechar', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    const setting: Setting = {
      name: 'unifi.default.auth.minutes',
      value: this.connectionTimeForm.value.duration.toString()
    };
    this.toolsService.saveSetting(setting)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.snackBar.open('Tempo de conexão salvo com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erro ao salvar tempo de conexão:', err);
          this.snackBar.open('Erro ao salvar tempo de conexão.', 'Fechar', { duration: 3000 });
        }
      });
  }
}
