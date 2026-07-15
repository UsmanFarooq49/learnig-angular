import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginLeftPage } from './login-left-page';

describe('LoginLeftPage', () => {
  let component: LoginLeftPage;
  let fixture: ComponentFixture<LoginLeftPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginLeftPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginLeftPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
