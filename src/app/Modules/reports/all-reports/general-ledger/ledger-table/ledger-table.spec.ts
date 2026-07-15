import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerTable } from './ledger-table';

describe('LedgerTable', () => {
  let component: LedgerTable;
  let fixture: ComponentFixture<LedgerTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
