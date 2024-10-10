import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SnackbarService } from '../services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar: MatSnackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError(error => {
      snackbar.open(
        'Error found: ' +
          (typeof error.error === 'string' ? error.error : error.message),
        '',
        {
          duration: 5000,
        }
      );
      return throwError(() => error);
    })
  );
};
