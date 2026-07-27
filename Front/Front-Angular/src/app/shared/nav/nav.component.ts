import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { AuthTokenService } from '../../services/auth-token.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  private readonly authToken = inject(AuthTokenService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  get isLoggedIn(): boolean {
    return this.authToken.isAuthenticated();
  }

  logout(): void {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
