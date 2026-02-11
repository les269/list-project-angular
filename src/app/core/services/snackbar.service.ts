import { Component, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {}

  isBlankMessage(name: string) {
    this.snackBar.open(
      this.translateService.instant('msg.blank', {
        name: this.translateService.instant(name),
      }),
      '',
      {
        duration: 3000,
      }
    );
  }

  openI18N(name: string, obj?: Object) {
    this.snackBar.open(this.translateService.instant(name, obj), '', {
      duration: 5000,
    });
  }

  openSnackBar(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
    });
  }

  openErrorSnackbar(message: string): void {
    console.error(message);

    this.snackBar.open(message, 'Dismiss', {
      panelClass: ['error-snackbar'],
    });
  }
}
