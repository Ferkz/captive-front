import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private unsubscribe$ = new Subject<void>()
  private unifiOriginalParams: Params = {};
  clientMac: string | null = null;
  apMac: string | null = null;
  originalRedirectUrl: string | null = null;
  ssid: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(params =>{
      console.log('HomeComponnet - Query params recebidos do Unifi: ', params);
      this.unifiOriginalParams = { ...params};

      this.clientMac = params['id'] || params ['mac'] || null;
      this.apMac = params ['ap'] || null;
      this.originalRedirectUrl = params ['url'] || null;
      this.ssid = params ['ssid'] || null;
      //verificando params

      if(this.clientMac){
        console.log(`MAC do cliente (id): ${this.clientMac}, AP ${this.apMac} original url ${this.originalRedirectUrl} ssid ${this.ssid}`)
      }else {
        console.warn('HomeComponent: MAC do cliente (parâmetro "id" ou "mac") não encontrado na URL do UniFi.');
      }
    });
  }
  navigateToGuestLogin(): void{
    if(!this.clientMac){
      console.error('Navegação para login falhou: MAC do cliente não disponível.');
      return
    }
    // Navega para a rota /login e repassa TODOS os queryParams originais do UniFi
    this.router.navigate(['/login'], { queryParams: this.unifiOriginalParams });
  }
  navigateToGuestRegistration(): void {
    if (!this.clientMac) {
      console.error('Navegação para cadastro falhou: MAC do cliente não disponível.');
      return;
    }
    this.router.navigate(['/cadastro'], { queryParams: this.unifiOriginalParams });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
