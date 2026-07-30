import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideEnvironmentNgxCurrency } from 'ngx-currency';
import { NgxSpinnerModule } from 'ngx-spinner';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    importProvidersFrom(NgxSpinnerModule.forRoot()),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideEnvironmentNgxCurrency({
      align: 'left',
      allowNegative: false,
      allowZero: false,
      decimal: ',',
      precision: 2,
      prefix: 'R$ ',
      suffix: '',
      thousands: '.',
      nullable: true,
      min: 0.01,
    }),
  ],
};
