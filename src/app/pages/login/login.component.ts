// src/app/pages/login/login.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CaptivePortalService, GuestLoginRequest, BackendPortalResponse } from './../../services/captive-portal.service';
import { cpfValidator } from 'src/app/shared/validators/cpf.validator';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  guestLoginForm: FormGroup;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  unifiOriginalParams: Params = {};
  clientMac: string | null = null;
  accessPointMac: string | null = null;
  ssid: string | null = null;
  originalUrl: string | null = null;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private captivePortalService: CaptivePortalService
  ) {
    this.guestLoginForm = this.fb.group({
      cpf: ['', [Validators.required, cpfValidator()]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        console.log('LoginComponent (Convidado) - Query params recebidos:', params);
        this.unifiOriginalParams = { ...params };
        this.clientMac = params['mac'] || params['client_mac'] || params['id'] || null;
        this.accessPointMac = params['ap'] || params['ap_mac'] || null;
        this.ssid = params['ssid'] || null;
        this.originalUrl = params['url'] || params['redirect'] || params['original_url'] || null;

        if (!this.clientMac) {
          this.errorMessage = 'Endereço MAC do dispositivo não fornecido. Impossível continuar o login.';
          console.error('Client MAC address is missing from URL parameters.');
        } else {
          console.log('Parâmetros capturados do portal cativo para login:');
          console.log('Client MAC:', this.clientMac);
          console.log('AP MAC:', this.accessPointMac);
          console.log('SSID:', this.ssid);
          console.log('Original URL:', this.originalUrl);
        }
      });
  }

  get glf() { return this.guestLoginForm.controls; }

  onSubmit(): void {
    if (this.guestLoginForm.invalid) {
      Object.values(this.guestLoginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.errorMessage = 'Por favor, insira um CPF válido para fazer login.';
      return;
    }

    if (!this.clientMac) {
      this.errorMessage = 'MAC address do cliente é obrigatório para login. Verifique o redirecionamento do portal.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const requestData: GuestLoginRequest = {
      cpf: this.glf['cpf'].value,
      deviceMac: this.clientMac,
      accessPointMac: this.accessPointMac || undefined
    };

    this.captivePortalService.guestLogin(requestData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response: BackendPortalResponse) => {
          this.isLoading = false;
          console.log('reposta do server' + response);

          if (response) {
            let messageToDisplay = response.description || 'Login de convidado bem-sucedido!';

            if (typeof response.payload === 'string' && response.payload.length > 0) {
              messageToDisplay = response.payload;
            } else if (response.payload && response.payload.message) {
              messageToDisplay = response.payload.message;
            }
            this.successMessage = messageToDisplay;
            console.log('Login de convidado bem-sucedido, UniFi autorizado.', response);
            if (this.originalUrl) {
              window.location.href = this.originalUrl;
            } else {
              this.router.navigate(['/success-page']);
            }
          } else {
            this.errorMessage = 'Resposta inesperada do servidor após o login de convidado.';
            console.warn('Estrutura da resposta de login de convidado inesperada.', response);
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Falha na requisição (error handler):', err);

          if (
            err.description &&
            err.description.includes('Registration Not Found')
          ) {
            this.errorMessage = 'Usuário não encontrado.';
          } else {
            this.errorMessage = err.message || 'Erro inesperado.';
          }
        }
      });
  }

  goToRegistration(): void {
    if (!this.clientMac) {
      this.errorMessage = 'Não foi possível detectar o MAC do dispositivo para prosseguir com o cadastro.';
      return;
    }
    this.router.navigate(['/cadastro'], { queryParams: this.unifiOriginalParams });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
