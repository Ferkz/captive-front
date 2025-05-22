import { TestBed } from '@angular/core/testing';

import { GuestRegistrationService } from './guest-registration.service';

describe('GuestRegistrationService', () => {
  let service: GuestRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuestRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
