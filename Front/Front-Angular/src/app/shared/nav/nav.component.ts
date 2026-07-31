import { animate, style, transition, trigger } from '@angular/animations';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { motionDuration } from '../motion/motion-timing';

const navDrawerAnimation = trigger('navDrawer', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-6px)' }),
    animate(motionDuration(220), style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(motionDuration(220), style({ opacity: 0, transform: 'translateY(-6px)' })),
  ]),
]);

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  animations: [navDrawerAnimation],
})
export class NavComponent implements OnInit {
  menuOpen = false;

  private readonly authToken = inject(AuthTokenService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  get isLoggedIn(): boolean {
    return this.authToken.isAuthenticated();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMenu());
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
