import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildUserMessage(error: HttpErrorResponse): string {
  const payload = error.error;
  const payloadMessage =
    payload && typeof payload === 'object'
      ? normalizeText((payload as Record<string, unknown>)['message']) ||
        normalizeText((payload as Record<string, unknown>)['error'])
      : '';
  const payloadPath =
    payload && typeof payload === 'object'
      ? normalizeText((payload as Record<string, unknown>)['path'])
      : '';

  const statusCode = error.status || 'unknown';
  const topLevelMessage = normalizeText(error.message);
  const reason = payloadMessage || topLevelMessage || 'Request failed';
  const pathText = payloadPath ? ` [${payloadPath}]` : '';

  return `Error found (${statusCode}): ${reason}${pathText}`;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar: MatSnackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const userMessage = buildUserMessage(error);

      console.error('[HTTP ERROR]', {
        request: {
          method: req.method,
          url: req.urlWithParams,
        },
        response: {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        },
        payload: error.error,
      });

      snackbar.open(userMessage, '', {
        duration: 10000,
      });

      return throwError(() => error);
    })
  );
};
