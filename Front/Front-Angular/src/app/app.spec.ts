import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NavComponent } from './shared/nav/nav.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: class StubComponent {} },
        ]),
      ],
    }).compileComponents();
  });

  it('renders nav and router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-nav')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.debugElement.query((d) => d.componentInstance instanceof NavComponent)).toBeTruthy();
  });
});
