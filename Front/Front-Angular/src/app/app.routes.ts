import { Routes } from '@angular/router';
import { EventoFormComponent } from './components/eventos/evento-form/evento-form.component';
import { EventosListComponent } from './components/eventos/eventos-list/eventos-list.component';
import { PalestrantesComponent } from './components/palestrantes/palestrantes/palestrantes.component';
import { ChangePasswordComponent } from './components/user/change-password/change-password.component';
import { LoginComponent } from './components/user/login/login.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { RegisterComponent } from './components/user/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: 'eventos', component: EventosListComponent },
  { path: 'eventos/new', component: EventoFormComponent, canActivate: [authGuard] },
  { path: 'eventos/:id', component: EventoFormComponent, canActivate: [authGuard] },
  { path: 'palestrantes', component: PalestrantesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
];
