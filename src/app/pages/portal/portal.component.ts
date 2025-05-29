import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { GuestRegistrationService, GuestRegistrationData, GuestRegistrationResponse } from '../../services/guest-registration.service';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit, OnDestroy {
  cadastroPortalForm: FormGroup;
  isLoading = false;
  erro: string | null = null;
  successMessage: string | null = null;

  unifiOriginalParams: Params = {};
  clientMacFromUrl: string | null = null;
  apMacFromUrl: string | null = null;
  originalRedirectUrl: string | null = null;


  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private guestRegistrationService: GuestRegistrationService,
    private snackBar: MatSnackBar
  ) {
    this.cadastroPortalForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^(?!([A-Za-zÀ-ÖØ-öø-ÿ\s'-])\1{2,})[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
      sobrenome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^(?!([A-Za-zÀ-ÖØ-öø-ÿ\s'-])\1{2,})[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{10,20}$/)]],
      acceptTou: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        console.log('PortalComponent (Cadastro) - Query params recebidos:', params);
        this.unifiOriginalParams = { ...params };
        this.clientMacFromUrl = params['mac'] || params['client_mac'] || params['id'] || null;
        this.apMacFromUrl = params['ap'] || params['ap_mac'] || null;
        this.originalRedirectUrl = params['url'] || params['redirect'] || null;

        if (!this.clientMacFromUrl) {
          this.erro = 'Informações do dispositivo (MAC address) não encontradas na URL. Não é possível prosseguir com o cadastro.';
          this.snackBar.open(this.erro, 'Fechar', { duration: 7000, panelClass: ['error-snackbar'] });
        }
        console.log('MAC do cliente da URL:', this.clientMacFromUrl);
        console.log('AP MAC da URL:', this.apMacFromUrl);
        console.log('URL Original:', this.originalRedirectUrl);
      });
  }

  get f() { return this.cadastroPortalForm.controls; }

  onSubmit(): void {
    this.erro = null;
    this.successMessage = null;
    if (this.cadastroPortalForm.invalid) {
      Object.values(this.cadastroPortalForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.erro = 'Por favor, preencha todos os campos obrigatórios corretamente.';
      if (this.f['acceptTou'] && !this.f['acceptTou'].value) {
        this.erro = 'Você deve aceitar os Termos de Uso para prosseguir.';
      }
      this.snackBar.open(this.erro, 'Fechar', { duration: 4000, panelClass: ['warning-snackbar'] });
      return;
    }
    if (!this.clientMacFromUrl) {
      this.erro = 'MAC address do dispositivo não detectado. Recarregue a página ou reconecte-se ao Wi-Fi.';
      this.snackBar.open(this.erro, 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
    }
    this.isLoading = true;
    const formValue = this.cadastroPortalForm.value;

    const registrationData: GuestRegistrationData = {
      fullName: `${formValue.nome} ${formValue.sobrenome}`,
      email: formValue.email,
      phoneNumber: formValue.telefone,
      acceptTou: formValue.acceptTou,
      deviceMac: this.clientMacFromUrl,
      accessPointMac: this.apMacFromUrl || undefined,
    };

     this.guestRegistrationService.registerAndAuthorize(registrationData)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.unsubscribe$)
      )
      .subscribe({
        next: (response: GuestRegistrationResponse) => {
          this.isLoading = false;
          console.log('Resposta completa recebida no PortalComponent (next):', response);

          if (response && response.responseId === 200) {
            const descriptionLower = response.responseDescription?.trim().toLowerCase();
            const payloadString = typeof response.payload === 'string' ? response.payload : '';

            if (descriptionLower === "already active") {
              this.successMessage = payloadString || 'Seu dispositivo já está autorizado e com uma sessão ativa.';
            } else if (descriptionLower === "registration updated") {
              this.successMessage = payloadString || 'Cadastro atualizado e acesso à internet liberado!';
            } else if (descriptionLower === "registration successful") {
              this.successMessage = payloadString || 'Cadastro e autorização realizados com sucesso! Você já pode navegar.';
            } else {
              this.successMessage = `Sucesso: ${response.responseDescription}. ${payloadString}`;
              if (!this.successMessage.trim()) {
                this.successMessage = 'Operação realizada com sucesso.';
              }
            }

            this.snackBar.open(this.successMessage, 'OK', { duration: 7000, panelClass: ['success-snackbar'] });
            this.cadastroPortalForm.disable();

            setTimeout(() => {
              window.location.href = this.originalRedirectUrl || 'https://www.google.com';
            }, 2500);

          } else {
            this.erro = response.errorDescription || response.responseDescription || 'Resposta inesperada do servidor.';
            this.snackBar.open(this.erro || 'Erro desconhecido.', 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Falha na requisição (error handler):', err);

          if (err.status === 409) {
            this.erro = err.message || 'Este e-mail já possui um cadastro. Por favor, use a opção "Login".';
            this.snackBar.open(this.erro || 'Erro desconhecido.', 'Fechar', { duration: 7000, panelClass: ['warning-snackbar'] });

            setTimeout(() => {
              this.router.navigate(['/login-convidado'], { queryParams: this.unifiOriginalParams });
            }, 3000);

          } else {
            this.erro = err.message || 'Falha crítica ao realizar o cadastro. Tente novamente mais tarde.';
            this.snackBar.open(this.erro || 'Erro desconhecido.', 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        }
      });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

