import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { api } from '../environments/environment';
import { API_BASE_URL } from './core/tokens/api-base-url.token';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: api },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
    provideTranslateService({
      fallbackLang: 'zh-tw',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
        failOnError: true,
      }),
    }),
    importProvidersFrom(MatNativeDateModule, MatSnackBarModule),
  ],
};
