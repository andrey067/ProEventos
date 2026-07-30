import { describe, it, expect } from 'vitest';
import { routes } from './app.routes';
import { EventosListComponent } from './components/eventos/eventos-list/eventos-list.component';
import { EventoFormComponent } from './components/eventos/evento-form/evento-form.component';
import { PalestranteFormComponent } from './components/palestrantes/palestrante-form/palestrante-form.component';
import { PalestrantesComponent } from './components/palestrantes/palestrantes/palestrantes.component';
import { LoginComponent } from './components/user/login/login.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { RegisterComponent } from './components/user/register/register.component';
import { authGuard } from './guards/auth.guard';

describe('app.routes', () => {
  it('defines expected paths and components', () => {
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '', redirectTo: 'eventos', pathMatch: 'full' }),
        expect.objectContaining({ path: 'eventos', component: EventosListComponent }),
        expect.objectContaining({
          path: 'eventos/new',
          component: EventoFormComponent,
          canActivate: [authGuard],
        }),
        expect.objectContaining({
          path: 'eventos/:id',
          component: EventoFormComponent,
          canActivate: [authGuard],
        }),
        expect.objectContaining({ path: 'palestrantes', component: PalestrantesComponent }),
        expect.objectContaining({
          path: 'palestrantes/new',
          component: PalestranteFormComponent,
          canActivate: [authGuard],
        }),
        expect.objectContaining({
          path: 'palestrantes/:id',
          component: PalestranteFormComponent,
          canActivate: [authGuard],
        }),
        expect.objectContaining({ path: 'login', component: LoginComponent }),
        expect.objectContaining({ path: 'register', component: RegisterComponent }),
        expect.objectContaining({
          path: 'perfil',
          component: ProfileComponent,
          canActivate: [authGuard],
        }),
        expect.objectContaining({
          path: 'change-password',
          redirectTo: 'perfil',
          pathMatch: 'full',
        }),
      ]),
    );
  });
});
