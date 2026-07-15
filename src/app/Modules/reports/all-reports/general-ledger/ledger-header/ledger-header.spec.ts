import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerHeader } from './ledger-header';

describe('LedgerHeader', () => {
  let component: LedgerHeader;
  let fixture: ComponentFixture<LedgerHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
