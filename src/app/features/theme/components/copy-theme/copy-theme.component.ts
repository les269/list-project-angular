import { Component, inject, signal } from '@angular/core';
import { form, readonly, required } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap, take } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopyThemeData, ThemeHeaderCopy, ThemeHeaderType } from '../../models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-copy-theme',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
    SignalFieldComponent,
  ],
  templateUrl: './copy-theme.component.html',
  styleUrl: './copy-theme.component.scss',
})
export class CopyThemeComponent {
  //inject
  readonly dialogRef = inject(MatDialogRef<CopyThemeComponent>);
  readonly data = inject<CopyThemeData>(MAT_DIALOG_DATA);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  //enum
  readonly fieldType = SignalFieldType;
  readonly themeTypeOptions = Object.values(ThemeHeaderType).map(value => ({
    value,
    label: `themeHeader.${value}`,
  }));
  readonly formModel = signal({
    name: this.data.themeHeader.name,
    version: this.data.themeHeader.version,
    type: this.data.themeHeader.type,
    title: this.data.themeHeader.title,
  });
  readonly form = form(this.formModel, p => {
    required(p.name, { message: 'msg.required' });
    required(p.version, { message: 'msg.required' });
    required(p.type, { message: 'msg.required' });
    required(p.title, { message: 'msg.required' });
    readonly(p, { when: () => this.isProcessing() });
  });

  //signals
  readonly nameControl = this.form.name;
  readonly versionControl = this.form.version;
  readonly typeControl = this.form.type;
  readonly titleControl = this.form.title;
  readonly isProcessing = signal(false);

  ok() {
    if (this.isProcessing()) return;
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }

    const formValue = this.form().value();
    const target: ThemeHeaderCopy = {
      ...this.data.themeHeader,
      ...formValue,
    };

    this.isProcessing.set(true);
    const wasDisableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.themeService
      .existTheme(target)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.themeExist');
            return EMPTY;
          }
          return this.themeService.copyTheme({
            source: this.data.themeHeader,
            target,
          });
        }),
        take(1),
        finalize(() => {
          this.isProcessing.set(false);
          this.dialogRef.disableClose = wasDisableClose;
        })
      )
      .subscribe({
        next: () => {
          this.dialogRef.close('ok');
        },
        error: () => {},
      });
  }
}
