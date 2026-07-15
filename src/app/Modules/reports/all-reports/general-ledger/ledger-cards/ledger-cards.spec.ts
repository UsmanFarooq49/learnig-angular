import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerCards } from './ledger-cards';

describe('LedgerCards', () => {
  let component: LedgerCards;
  let fixture: ComponentFixture<LedgerCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
