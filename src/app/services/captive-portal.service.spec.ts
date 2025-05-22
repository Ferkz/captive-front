import { TestBed } from '@angular/core/testing';

import { CaptivePortalService } from './captive-portal.service';

describe('CaptivePortalService', () => {
  let service: CaptivePortalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaptivePortalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
