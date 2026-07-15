import { TestBed } from '@angular/core/testing';

import { PaymentVoucherService } from './payment-voucher-service';

describe('PaymentVoucherService', () => {
  let service: PaymentVoucherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentVoucherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
