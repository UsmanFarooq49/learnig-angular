import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialBalance } from './trial-balance';

describe('TrialBalance', () => {
  let component: TrialBalance;
  let fixture: ComponentFixture<TrialBalance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrialBalance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrialBalance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
