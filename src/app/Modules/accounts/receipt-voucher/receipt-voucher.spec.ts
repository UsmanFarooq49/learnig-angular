import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptVoucher } from './receipt-voucher';

describe('ReceiptVoucher', () => {
  let component: ReceiptVoucher;
  let fixture: ComponentFixture<ReceiptVoucher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptVoucher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptVoucher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
