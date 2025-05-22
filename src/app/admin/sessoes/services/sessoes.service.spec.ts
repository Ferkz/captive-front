import { TestBed } from '@angular/core/testing';

import { SessoesService } from './sessoes.service';

describe('SessoesService', () => {
  let service: SessoesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessoesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
