import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalVoucher } from './journal-voucher';

describe('JournalVoucher', () => {
  let component: JournalVoucher;
  let fixture: ComponentFixture<JournalVoucher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalVoucher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JournalVoucher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
