import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralLedger } from './general-ledger';

describe('GeneralLedger', () => {
  let component: GeneralLedger;
  let fixture: ComponentFixture<GeneralLedger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralLedger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralLedger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
