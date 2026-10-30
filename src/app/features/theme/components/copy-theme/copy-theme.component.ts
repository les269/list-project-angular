import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, readonly, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap, take } from 'rxjs';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { FormAlert } from '../../../../core/model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { CopyThemeData, ThemeHeaderCopy, ThemeHeaderType } from '../../models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-copy-theme',
  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    TrimOnBlurDirective,
    FormInvalidsComponent,
  ],
  templateUrl: './copy-theme.component.html',
})
export class CopyThemeComponent {
  //inject
  readonly dialogRef = inject(MatDialogRef<CopyThemeComponent>);
  readonly data = inject<CopyThemeData>(MAT_DIALOG_DATA);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  readonly translateService = inject(TranslateService);
  //enum
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly formModel = signal({
    name: this.data.themeHeader.name,
    version: this.data.themeHeader.version,
    type: this.data.themeHeader.type,
    title: this.data.themeHeader.title,
  });
  readonly form = form(this.formModel, p => {
    required(p.name);
    required(p.version);
    required(p.type);
    required(p.title);
    readonly(p, { when: () => this.isProcessing() });
  });

  //signals
  readonly nameControl = this.form.name;
  readonly versionControl = this.form.version;
  readonly typeControl = this.form.type;
  readonly titleControl = this.form.title;
  readonly isProcessing = signal(false);

  private readonly requiredMessage = toSignal(
    this.translateService.stream('msg.required'),
    { initialValue: this.translateService.instant('msg.required') }
  );

  readonly formAlertsObj = computed(() => {
    const required = {
      errorId: 'required',
      msg: this.requiredMessage(),
    };
    return {
      name: [required],
      version: [required],
      title: [required],
    } satisfies Record<string, FormAlert[]>;
  });

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
